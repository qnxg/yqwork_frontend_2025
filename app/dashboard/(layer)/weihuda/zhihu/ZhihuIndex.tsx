"use client";

import {
	Button,
	Card,
	Col,
	Form,
	Input,
	Modal,
	Row,
	Space,
	Table,
	Tag,
	Toast,
	Tooltip,
	Upload,
} from "@douyinfe/semi-ui-19";
import {
	IconDelete,
	IconEdit,
	IconImport,
	IconPlus,
} from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import {
	deleteZhihuByIdApi,
	getZhihuUrlResolveApi,
	IZhihuPostData,
	postZhihuApi,
	putZhihuByIdApi,
	type IZhihu,
	type IZhihuPageQueryData,
	type IZhihuPageResponseData,
	type IZhihuPutData,
} from "@/api/weihuda/zhihu";
import { ZhihuPublishStatusOptions, ZhihuTypeOptions } from "@/config/fields";
import { getProxyUrl, hasPermission, sliceString } from "@/utils";
import { withToast } from "@/utils/action";
import dayjs from "dayjs";
import XRichText from "@/components/XRichText";
import { IDomEditor } from "@wangeditor/editor";
import { postUploadImgApi } from "@/api/upload";
import { RequiredRule } from "@/utils/form";

const PERMISSION_PREFIX = "hdwsh:zhihu";

export interface ZhihuIndexPayload {
	data: IZhihuPageResponseData;
	queryData: IZhihuPageQueryData;
	permissions: string[];
	zhihuTags: string[];
}

function parseQueryFromSearchParams(sp: URLSearchParams): IZhihuPageQueryData {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
		title: sp.get("title") ?? undefined,
		tags: sp.get("tags") ?? undefined,
		status: sp.get("status") !== null ? Number(sp.get("status")) : undefined,
		stuId: sp.get("stuId") ?? undefined,
	};
}

export default function ZhihuIndex({
	payload,
}: Readonly<{ payload: ZhihuIndexPayload }>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");
	const [editing, setEditing] = useState<IZhihu | null>(null);
	const [modalOpen, setModalOpen] = useState<boolean>(false);

	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const currentPage = queryFromUrl.page ?? 1;
	const pageSize = queryFromUrl.pageSize ?? 10;
	const { rows, count: total } = payload.data;
	const tagSuggestions = payload.zhihuTags;

	const filterFormApi = useRef<FormApi>(null);

	const updateSearchParams = (params: IZhihuPageQueryData) => {
		const next = new URLSearchParams();
		if (params.page) next.set("page", String(params.page));
		if (params.pageSize) next.set("pageSize", String(params.pageSize));
		if (params.title) next.set("title", params.title);
		if (params.tags) next.set("tags", params.tags);
		if (params.status !== undefined) next.set("status", String(params.status));
		if (params.stuId) next.set("stuId", params.stuId);
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	useEffect(() => {
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [payload.data]);

	const { canAdd, canEdit, canDelete } = useMemo(() => {
		const perms = payload.permissions;
		return {
			canAdd: hasPermission(perms, `${PERMISSION_PREFIX}:add`),
			canEdit: hasPermission(perms, `${PERMISSION_PREFIX}:edit`),
			canDelete: hasPermission(perms, `${PERMISSION_PREFIX}:delete`),
		};
	}, [payload.permissions]);

	const handleFilter = () => {
		if (!filterFormApi.current) return;
		const values = filterFormApi.current.getValues();
		setLoading("table");
		updateSearchParams({
			page: 1,
			pageSize,
			title: values.title?.trim() || undefined,
			tags: (values.tags as string)?.trim() || undefined,
			status: values.status ?? undefined,
			stuId: values.stuId?.trim() || undefined,
		});
	};

	const handleReset = () => {
		if (!filterFormApi.current) return;
		filterFormApi.current.reset();
		setLoading("table");
		updateSearchParams({ page: 1, pageSize: 10 });
	};

	const handleDelete = (id: number) => {
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该知湖文章吗？该操作不可逆。",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteZhihuByIdApi(id), "删除成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	const renderStatusTag = (status: number) => {
		const option = ZhihuPublishStatusOptions.find(
			(opt) => opt.value === status,
		);
		return option ? (
			<Tag color={option.color}>{option.label}</Tag>
		) : (
			<Tag color="grey">未知</Tag>
		);
	};

	const renderTypLabel = (typ: string) => {
		const option = ZhihuTypeOptions.find((o) => o.value === typ);
		return option ? option.label : typ;
	};

	const columns = [
		{
			title: "编号",
			dataIndex: "id",
			key: "id",
			width: 80,
		},
		{
			title: "文章标题",
			dataIndex: "info.title",
			key: "title",
			ellipsis: true,
			width: 200,
			render: (text: string, record: IZhihu) => {
				let display = sliceString(text, 15);
				if (record.info.top) {
					display = `（顶置）${display}`;
				}
				return (
					<Tooltip content={text}>
						<span className="cursor-default">{display}</span>
					</Tooltip>
				);
			},
		},
		{
			title: "类型",
			dataIndex: "info.typ",
			key: "typ",
			width: 60,
			render: (typ: string) => renderTypLabel(typ),
		},
		{
			title: "标签",
			dataIndex: "info.tags",
			key: "tags",
			width: 100,
			render: (tags?: string) => {
				if (!tags) return "-";
				const arr = tags
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean);
				return (
					<Space wrap>
						{arr.slice(0, 3).map((t) => (
							<Tag key={t}>{t}</Tag>
						))}
						{arr.length > 3 && <Tag>{`+${arr.length - 3}`}</Tag>}
					</Space>
				);
			},
		},
		{
			title: "状态",
			dataIndex: "info.status",
			key: "status",
			width: 100,
			render: (status: number) => renderStatusTag(status),
		},
		{
			title: "发布时间",
			dataIndex: "info.createdAt",
			key: "createdAt",
			width: 140,
			render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
		},
		{
			title: "发布者",
			dataIndex: "info.stuId",
			key: "stuId",
			width: 120,
		},
		{
			title: "操作",
			key: "action",
			width: 160,
			fixed: "right" as const,
			render: (_: unknown, record: IZhihu) => (
				<Space>
					{canEdit && (
						<Button
							theme="light"
							type="primary"
							icon={<IconEdit />}
							onClick={() => {
								setEditing(record);
								setModalOpen(true);
							}}
							disabled={loading !== ""}
						>
							编辑
						</Button>
					)}
					{canDelete && (
						<Button
							theme="light"
							type="danger"
							icon={<IconDelete />}
							onClick={() => {
								handleDelete(record.id);
							}}
							loading={loading === `delete-${record.id}`}
							disabled={loading !== ""}
						>
							删除
						</Button>
					)}
				</Space>
			),
		},
	];

	return (
		<div>
			<Card className="mb-4">
				<h4 className="text-lg font-medium mb-4">筛选条件</h4>
				<Form
					getFormApi={(api) => (filterFormApi.current = api)}
					initValues={{
						title: queryFromUrl.title ?? "",
						tags: queryFromUrl.tags ?? "",
						status: queryFromUrl.status ?? undefined,
						stuId: queryFromUrl.stuId ?? "",
					}}
				>
					<Space wrap className="mb-4">
						<Form.Input
							field="title"
							label="文章标题"
							placeholder="关键字筛选"
							className="w-48"
						/>
						<Form.Input
							field="tags"
							label="标签"
							placeholder="关键字筛选"
							className="w-48"
						/>
						<Form.Select
							field="status"
							label="文章状态"
							placeholder="请选择状态"
							optionList={ZhihuPublishStatusOptions}
							showClear
							className="w-40"
						/>
						<Form.Input
							field="stuId"
							label="发布者学号"
							placeholder="学号"
							className="w-40"
						/>
					</Space>
				</Form>
				<Space>
					<Button
						type="primary"
						onClick={handleFilter}
						loading={loading === "table"}
					>
						查询
					</Button>
					<Button onClick={handleReset} disabled={loading !== ""}>
						重置
					</Button>
				</Space>
			</Card>

			{canAdd && (
				<Button
					theme="solid"
					type="warning"
					className="mb-4"
					onClick={() => {
						setEditing(null);
						setModalOpen(true);
					}}
					icon={<IconPlus />}
				>
					新增
				</Button>
			)}

			<Table
				columns={columns}
				dataSource={rows}
				rowKey="id"
				loading={loading === "table"}
				empty={<div>暂无知湖文章</div>}
				pagination={{
					currentPage,
					pageSize,
					total,
					onChange: (newPage: number, newSize: number) => {
						setLoading("table");
						updateSearchParams({
							page: newPage,
							pageSize: newSize,
							title: queryFromUrl.title,
							tags: queryFromUrl.tags,
							status: queryFromUrl.status,
							stuId: queryFromUrl.stuId,
						});
					},
				}}
			/>

			<Modal
				title={editing ? "编辑" : "新增"}
				fullScreen
				visible={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
				}}
				footer={null}
				style={{ maxWidth: "100%", width: "100%" }}
			>
				<div
					className="overflow-y-auto pr-2"
					style={{ maxHeight: "calc(100vh - 80px)" }}
				>
					<ZhihuFormModal
						editing={editing}
						tagSuggestions={tagSuggestions}
						onSuccess={() => {
							setModalOpen(false);
							setEditing(null);
							router.refresh();
						}}
						onCancel={() => {
							setModalOpen(false);
							setEditing(null);
						}}
					/>
				</div>
			</Modal>
		</div>
	);
}

interface ZhihuFormModalProps {
	editing: IZhihu | null;
	tagSuggestions: string[];
	onSuccess: () => void;
	onCancel: () => void;
}

function ZhihuFormModal({
	editing,
	tagSuggestions,
	onSuccess,
	onCancel,
}: ZhihuFormModalProps) {
	const [importUrl, setImportUrl] = useState("");
	const [importLoading, setImportLoading] = useState(false);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [contentTyp, setContentTyp] = useState<string>(
		editing?.info.typ ?? ZhihuTypeOptions[0].value,
	);
	const [coverUrl, setCoverUrl] = useState<string>(editing?.info.cover ?? "");
	const formApiRef = useRef<FormApi | null>(null);
	const editorRef = useRef<IDomEditor | null>(null);

	const handleImportFromWx = async () => {
		const url = importUrl.trim();
		if (!url || url.length === 0) return;
		setImportLoading(true);
		try {
			const res = await withToast(() => getZhihuUrlResolveApi(url), "解析成功");
			const api = formApiRef.current;
			if (api) {
				api.setValue("title", res.title);
				api.setValue("cover", res.cover);
				api.setValue("typ", "link");
				api.setValue("content", url);
			}
			setCoverUrl(res.cover);
			setContentTyp("link");
			setImportUrl("");
		} catch {}
		setImportLoading(false);
	};

	const handleSubmit = async () => {
		if (!formApiRef.current) return;
		setSubmitLoading(true);
		try {
			const values = await formApiRef.current.validate();
			const typ: string = values.typ;
			const content =
				typ === "link"
					? (values.content as string) || ""
					: (editorRef.current?.getHtml?.() ?? "");
			if (content.trim().length === 0) {
				// 一般触发这个应该是文章类型。链接类型早经过表单校验了
				Toast.error("请输入文章内容");
				// 不直接 return，因为只需要跳过 catch 块内容
				throw new Error();
			}
			let cover: string | undefined = values.cover;
			if (cover && cover.trim().length === 0) {
				cover = undefined;
			}
			const putData: IZhihuPutData = {
				title: values.title,
				content,
				tags: values.tags,
				cover,
				status: values.status,
				top: values.top,
			};
			if (editing) {
				await withToast(() => putZhihuByIdApi(editing.id, putData), "保存成功");
			} else {
				const postData: IZhihuPostData = {
					...putData,
					typ,
				};
				await withToast(() => postZhihuApi(postData), "添加成功");
			}
			onSuccess();
		} catch {}
		setSubmitLoading(false);
	};

	return (
		<div className="py-4 max-w-4xl mx-auto">
			{/* 导入公众号文章 */}
			{!editing && (
				<Form>
					<Form.Slot label={"从公众号文章导入"} />
					<div className="flex">
						<Input
							className="flex-1 mr-2"
							placeholder="请输入公众号文章分享链接"
							value={importUrl}
							onChange={(v) => setImportUrl(v)}
						/>
						<Button
							theme="light"
							onClick={handleImportFromWx}
							loading={importLoading}
							className="ml-auto"
							icon={<IconImport />}
						>
							导入
						</Button>
					</div>
					<div className="mt-2 text-xs text-[var(--semi-color-text-2)]">
						仅支持湖大微生活公众号（在微信公众平台与小程序关联的公众号）的文章，其他公众号的文章在小程序内无法打开
					</div>
				</Form>
			)}

			<Form
				getFormApi={(api) => (formApiRef.current = api)}
				labelPosition="top"
				layout="vertical"
				initValues={
					editing
						? {
								title: editing.info.title,
								tags: editing.info.tags,
								typ: editing.info.typ,
								status: editing.info.status,
								top: editing.info.top,
								content: editing.info.content,
								cover: editing.info.cover,
							}
						: {
								typ: contentTyp,
								status: ZhihuPublishStatusOptions[0].value,
								top: false,
							}
				}
			>
				<Form.Input
					field="title"
					label="文章标题"
					placeholder="请输入标题"
					rules={[RequiredRule]}
				/>

				<Row gutter={16}>
					<Col xs={24} sm={12} lg={8}>
						<Form.Select
							field="tags"
							label="文章标签"
							placeholder="请选择标签"
							optionList={tagSuggestions.map((t) => ({ label: t, value: t }))}
							rules={[RequiredRule]}
							className="w-full"
						/>
					</Col>
					<Col xs={24} sm={12} lg={8}>
						<Form.Select
							field="typ"
							label="类型"
							optionList={ZhihuTypeOptions}
							disabled={!!editing}
							rules={[RequiredRule]}
							onChange={(v) => setContentTyp(v as string)}
							className="w-full"
						/>
					</Col>
					<Col xs={24} sm={12} lg={8}>
						<Form.Select
							field="status"
							label="文章状态"
							optionList={ZhihuPublishStatusOptions}
							rules={[RequiredRule]}
							className="w-full"
						/>
					</Col>
				</Row>
				<Form.Slot label="文章封面">
					<div className="flex flex-col gap-2">
						<Upload
							fileName="coverFile"
							action="#"
							accept="image/*"
							listType="picture"
							limit={1}
							fileList={
								coverUrl.trim().length > 0
									? [
											{
												uid: "cover-1",
												name: "封面",
												size: "0",
												status: "success" as const,
												url: getProxyUrl(coverUrl),
											},
										]
									: []
							}
							onChange={({ fileList }) => {
								setCoverUrl(fileList[0]?.url ?? "");
								formApiRef.current?.setValue?.("cover", fileList[0]?.url ?? "");
							}}
							customRequest={({ fileInstance, onError, onSuccess }) => {
								if (!fileInstance) {
									onError?.({ status: 0 });
									return;
								}
								postUploadImgApi(fileInstance, "cover-20240323")
									.then((res) => {
										setCoverUrl(res.url);
										formApiRef.current?.setValue?.("cover", res.url);
										onSuccess?.({ url: res.url });
									})
									.catch(() => {
										onError?.({ status: 500 });
									});
							}}
							onRemove={() => {
								setCoverUrl("");
								formApiRef.current?.setValue?.("cover", "");
							}}
						>
							<IconPlus size="extra-large" />
						</Upload>
					</div>
				</Form.Slot>
				<Form.Switch field="top" label="是否置顶" />

				{contentTyp === "link" ? (
					<Form.Input
						field="content"
						label="链接"
						rules={[RequiredRule]}
						placeholder="请输入链接 URL"
						style={{ width: "100%" }}
					/>
				) : (
					<Form.Slot label="内容">
						<Suspense fallback={<div>加载编辑器...</div>}>
							<XRichText
								className="mt-2"
								editorRef={editorRef}
								onLoaded={() => {
									const initialHtml = editing?.info.content ?? "";
									if (initialHtml) {
										setTimeout(() => {
											editorRef.current?.setHtml?.(initialHtml);
										}, 300);
									}
								}}
							/>
						</Suspense>
					</Form.Slot>
				)}

				<div className="flex gap-3 mt-6">
					<div className="ml-auto">
						<Button theme="light" type="tertiary" onClick={onCancel}>
							取消
						</Button>
						<Button
							theme="solid"
							type="primary"
							onClick={handleSubmit}
							loading={submitLoading}
							className="ml-2"
						>
							{editing ? "修改" : "添加"}
						</Button>
					</div>
				</div>
			</Form>
		</div>
	);
}
