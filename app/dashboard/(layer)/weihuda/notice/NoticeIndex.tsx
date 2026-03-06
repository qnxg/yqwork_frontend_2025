"use client";

import {
	Button,
	Card,
	Form,
	Modal,
	Space,
	Table,
	Tag,
	Tooltip,
} from "@douyinfe/semi-ui-19";
import { IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	deleteNoticeByIdApi,
	INotice,
	INoticePageQueryData,
	INoticePageResponseData,
	postNoticeApi,
} from "@/api/weihuda/notice";
import { NoticeStatusOptions } from "@/config/fields";
import { hasPermission, sliceString } from "@/utils";
import { withToast } from "@/utils/action";
import { RequiredRule } from "@/utils/form";
import dayjs from "dayjs";

const PERMISSION_PREFIX = "hdwsh:notice";

export interface NoticeIndexPayload {
	data: INoticePageResponseData;
	queryData: INoticePageQueryData;
	permissions: string[];
}

function parseQueryFromSearchParams(sp: URLSearchParams): INoticePageQueryData {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
		stuId: sp.get("stuId") ?? undefined,
		status: sp.get("status") !== null ? Number(sp.get("status")) : undefined,
		from: sp.get("from") ?? undefined,
		to: sp.get("to") ?? undefined,
	};
}

interface NoticeFormValues {
	stuId: string;
	content: string;
	isShow: boolean;
	url?: string;
}

export default function NoticeIndex({
	payload,
}: Readonly<{ payload: NoticeIndexPayload }>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");

	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const currentPage = queryFromUrl.page ?? 1;
	const pageSize = queryFromUrl.pageSize ?? 10;
	const { rows, count: total } = payload.data;

	const filterFormApi = useRef<FormApi | null>(null);
	const addFormApi = useRef<FormApi | null>(null);
	const [showAdd, setShowAdd] = useState(false);

	const updateSearchParams = (params: INoticePageQueryData) => {
		const next = new URLSearchParams();
		if (params.page) next.set("page", String(params.page));
		if (params.pageSize) next.set("pageSize", String(params.pageSize));
		if (params.stuId) next.set("stuId", params.stuId);
		if (params.status !== undefined && params.status !== null)
			next.set("status", String(params.status));
		if (params.from) next.set("from", params.from);
		if (params.to) next.set("to", params.to);
		setLoading("table");
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	useEffect(() => {
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [payload.data]);

	const { canAdd, canDelete } = useMemo(() => {
		const perms = payload.permissions;
		return {
			canAdd: hasPermission(perms, `${PERMISSION_PREFIX}:add`),
			canDelete: hasPermission(perms, `${PERMISSION_PREFIX}:delete`),
		};
	}, [payload.permissions]);

	const handleFilter = () => {
		if (!filterFormApi.current) return;
		const values = filterFormApi.current.getValues();
		const fromDate = values.from as Date | undefined;
		const toDate = values.to as Date | undefined;
		setLoading("table");
		updateSearchParams({
			page: 1,
			pageSize,
			stuId: values.stuId?.trim() || undefined,
			status: values.status ?? undefined,
			from: fromDate
				? dayjs(fromDate).format("YYYY-MM-DD 00:00:00")
				: undefined,
			to: toDate ? dayjs(toDate).format("YYYY-MM-DD 23:59:59") : undefined,
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
			content: "确定要删除该消息通知吗？该操作不可逆。",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteNoticeByIdApi(id), "删除成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	const handleAdd = async () => {
		if (!addFormApi.current) return;
		setLoading("submit");
		try {
			const values = (await addFormApi.current.validate()) as NoticeFormValues;
			await withToast(
				() =>
					postNoticeApi({
						stuId: values.stuId.trim(),
						content: values.content.trim(),
						isShow: values.isShow,
						url: values.url?.trim() || undefined,
					}),
				"添加成功",
			);
			setShowAdd(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const renderStatusTag = (status: number) => {
		const option = NoticeStatusOptions.find((opt) => opt.value === status);
		return option ? (
			<Tag color={option.color}>{option.label}</Tag>
		) : (
			<Tag color="grey">未知</Tag>
		);
	};

	const columns = [
		{
			title: "编号",
			dataIndex: "id",
			key: "id",
			width: 80,
		},
		{
			title: "学号",
			dataIndex: "stuId",
			key: "stuId",
			width: 130,
		},
		{
			title: "内容",
			dataIndex: "content",
			key: "content",
			ellipsis: true,
			width: 300,
			render: (text: string) => {
				const display = sliceString(text, 20);
				return (
					<Tooltip content={text}>
						<span className="cursor-default">{display}</span>
					</Tooltip>
				);
			},
		},
		{
			title: "首页展示",
			dataIndex: "isShow",
			key: "isShow",
			width: 80,
			render: (v: boolean) =>
				v ? <Tag color="green">是</Tag> : <Tag color="grey">否</Tag>,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 60,
			render: (status: number) => renderStatusTag(status),
		},
		{
			title: "跳转链接",
			dataIndex: "url",
			key: "url",
			width: 200,
			ellipsis: true,
			render: (url?: string) => {
				if (!url) return null;
				return (
					<Tooltip content={url}>
						<span className="cursor-default">{sliceString(url, 30)}</span>
					</Tooltip>
				);
			},
		},
		{
			title: "发送时间",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 130,
			render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
		},
		{
			title: "操作",
			key: "action",
			width: 120,
			fixed: "right" as const,
			render: (_: unknown, record: INotice) =>
				canDelete ? (
					<Button
						theme="light"
						type="danger"
						icon={<IconDelete />}
						onClick={() => handleDelete(record.id)}
						loading={loading === `delete-${record.id}`}
						disabled={loading !== ""}
					>
						删除
					</Button>
				) : null,
		},
	];

	return (
		<div>
			<Card className="mb-4">
				<h4 className="text-lg font-medium mb-4">筛选条件</h4>
				<Form
					getFormApi={(api) => {
						filterFormApi.current = api;
					}}
					initValues={{
						stuId: queryFromUrl.stuId ?? "",
						status: queryFromUrl.status ?? undefined,
						from: queryFromUrl.from ? new Date(queryFromUrl.from) : undefined,
						to: queryFromUrl.to ? new Date(queryFromUrl.to) : undefined,
					}}
				>
					<Space wrap className="mb-4">
						<Form.Input
							field="stuId"
							label="学号"
							placeholder="请输入学号"
							className="w-48"
						/>
						<Form.Select
							field="status"
							label="状态"
							placeholder="请选择状态"
							optionList={NoticeStatusOptions}
							showClear
							className="w-48"
						/>
						<Form.DatePicker
							field="from"
							label="开始时间"
							placeholder="起始时间"
							className="w-48"
							showClear
						/>
						<Form.DatePicker
							field="to"
							label="结束时间"
							placeholder="结束时间"
							className="w-48"
							showClear
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
					className="mt-2 mb-4"
					onClick={() => setShowAdd(true)}
					icon={<IconPlus />}
				>
					添加消息
				</Button>
			)}

			<Table
				columns={columns}
				dataSource={rows}
				rowKey="id"
				loading={loading === "table"}
				empty={<div>暂无消息通知</div>}
				pagination={{
					currentPage,
					pageSize,
					total,
					onChange: (newPage: number, newSize: number) => {
						setLoading("table");
						updateSearchParams({
							page: newPage,
							pageSize: newSize,
							stuId: queryFromUrl.stuId,
							status: queryFromUrl.status,
							from: queryFromUrl.from,
							to: queryFromUrl.to,
						});
					},
				}}
			/>

			<Modal
				title="添加消息通知"
				visible={showAdd}
				onOk={() => addFormApi.current?.submitForm?.()}
				onCancel={() => setShowAdd(false)}
				okText="添加"
				cancelText="取消"
				confirmLoading={loading === "submit"}
				width={520}
			>
				<Form
					getFormApi={(api) => {
						addFormApi.current = api;
					}}
					onSubmit={handleAdd}
					initValues={{
						isShow: true,
					}}
				>
					<Form.Input
						field="stuId"
						label="学号"
						rules={[RequiredRule]}
						placeholder="请输入学号"
					/>
					<Form.TextArea
						field="content"
						label="消息内容"
						rules={[RequiredRule]}
						placeholder="请输入消息内容"
						rows={4}
					/>
					<Form.Switch field="isShow" label="首页完整显示" />
					<Form.Input
						field="url"
						label="跳转链接"
						placeholder="选填，填写小程序跳转路径"
					/>
				</Form>
			</Modal>
		</div>
	);
}
