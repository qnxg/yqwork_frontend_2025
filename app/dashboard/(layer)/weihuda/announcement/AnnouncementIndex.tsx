"use client";

import {
	postMiniMessageApi,
	putMiniMessageByIdApi,
	deleteMiniMessageByIdApi,
	IAnnouncement,
	IAnnouncementBasicInfo,
	IAnnouncementPageResponseData,
} from "@/api/weihuda/announcement";
import type { IPageQueryData } from "@/api/interface";
import { IconEdit, IconDelete, IconPlus } from "@douyinfe/semi-icons";
import {
	Button,
	Modal,
	Space,
	Form,
	Table,
	Tooltip,
} from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RequiredRule } from "@/utils/form";
import { hasPermission, sliceString } from "@/utils";
import { withToast } from "@/utils/action";

const PERMISSION_PREFIX = "hdwsh:announcement";

export interface AnnouncementIndexPayload {
	data: IAnnouncementPageResponseData;
	queryData: IPageQueryData;
	permissions: string[];
}

function parseQueryFromSearchParams(sp: URLSearchParams): IPageQueryData {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
	};
}

export default function AnnouncementIndex({
	payload,
}: Readonly<{ payload: AnnouncementIndexPayload }>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");

	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const currentPage = queryFromUrl.page ?? 1;
	const pageSize = queryFromUrl.pageSize ?? 10;
	const { rows, count: total } = payload.data;

	const [showAdd, setShowAdd] = useState(false);
	const [showModify, setShowModify] = useState(false);
	const [editingData, setEditingData] = useState<IAnnouncement | null>(null);
	const formApi = useRef<FormApi | null>(null);

	const updateSearchParams = (params: IPageQueryData) => {
		const next = new URLSearchParams();
		if (params.page) next.set("page", String(params.page));
		if (params.pageSize) next.set("pageSize", String(params.pageSize));
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

	const columns = [
		{
			title: "ID",
			dataIndex: "id",
			width: 80,
		},
		{
			title: "标题",
			dataIndex: "title",
			width: 200,
			ellipsis: true,
		},
		{
			title: "内容",
			dataIndex: "content",
			ellipsis: true,
			render: (text: string) => {
				const display = sliceString(text, 50);
				return (
					<Tooltip content={text}>
						<span className="cursor-default">{display}</span>
					</Tooltip>
				);
			},
		},
		{
			title: "跳转链接",
			dataIndex: "url",
			width: 180,
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
			title: "操作",
			fixed: "right" as const,
			width: 180,
			render: (_: unknown, record: IAnnouncement) => {
				const isDeleted = !!record.deletedAt;
				if (isDeleted) return null;
				return (
					<Space>
						{canEdit && (
							<Button
								theme="light"
								type="secondary"
								icon={<IconEdit />}
								onClick={() => {
									setEditingData(record);
									setShowModify(true);
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
								disabled={loading !== ""}
								onClick={() => handleDelete(record.id)}
								loading={loading === `delete-${record.id}`}
							>
								删除
							</Button>
						)}
					</Space>
				);
			},
		},
	];

	const handleAdd = async () => {
		if (!formApi.current) return;
		setLoading("add");
		try {
			const values =
				(await formApi.current.validate()) as IAnnouncementBasicInfo;
			await withToast(() => postMiniMessageApi(values), "添加成功");
			setShowAdd(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleModify = async () => {
		if (!formApi.current || !editingData) return;
		setLoading("update");
		try {
			const values =
				(await formApi.current.validate()) as IAnnouncementBasicInfo;
			await withToast(
				() => putMiniMessageByIdApi(editingData.id, values),
				"修改成功",
			);
			setShowModify(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleDelete = (id: number) => {
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该公告吗？",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteMiniMessageByIdApi(id), "删除成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	return (
		<div>
			{canAdd && (
				<Button
					theme="solid"
					type="warning"
					className="mt-2 mb-4"
					onClick={() => setShowAdd(true)}
					icon={<IconPlus />}
				>
					添加公告
				</Button>
			)}
			<Table
				columns={columns}
				dataSource={rows}
				rowKey="id"
				loading={loading === "table"}
				empty={<div>暂无公告</div>}
				pagination={{
					currentPage,
					pageSize,
					total,
					onChange: (newPage: number, newSize: number) => {
						setLoading("table");
						updateSearchParams({
							page: newPage,
							pageSize: newSize,
						});
					},
				}}
			/>
			<Modal
				title={showModify ? "编辑公告" : "添加公告"}
				visible={showAdd || showModify}
				onOk={() => formApi.current?.submitForm?.()}
				onCancel={() => {
					setShowAdd(false);
					setShowModify(false);
					setEditingData(null);
				}}
				okText={showModify ? "保存" : "添加"}
				cancelText="取消"
				confirmLoading={loading === "add" || loading === "update"}
				width={520}
			>
				<Form
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={showModify ? handleModify : handleAdd}
					initValues={
						showModify && editingData
							? {
									title: editingData.title,
									content: editingData.content,
									url: editingData.url ?? "",
								}
							: undefined
					}
				>
					<Form.Input
						field="title"
						label="标题"
						rules={[RequiredRule]}
						placeholder="请输入标题"
					/>
					<Form.TextArea
						field="content"
						label="内容"
						rules={[RequiredRule]}
						placeholder="请输入内容"
						rows={4}
					/>
					<Form.Input
						field="url"
						label="跳转链接"
						placeholder="选填，填写小程序的页面路径"
					/>
				</Form>
			</Modal>
		</div>
	);
}
