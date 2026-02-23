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
import { IconDelete } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect, useMemo } from "react";
import {
	deleteFeedbackByIdApi,
	IFeedback,
	IFeedbackPageQueryData,
	IFeedbackPageResponseData,
} from "@/api/weihuda/feedback";
import { FeedbackStatusOptions } from "@/config/fields";
import { hasPermission, sliceString } from "@/utils";
import { withToast } from "@/utils/action";
import dayjs from "dayjs";

const PERMISSION_PREFIX = "hdwsh:feedback";

export interface FeedbackIndexPayload {
	data: IFeedbackPageResponseData;
	queryData: IFeedbackPageQueryData;
	permissions: string[];
}

function parseQueryFromSearchParams(
	sp: URLSearchParams,
): IFeedbackPageQueryData {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
		stuId: sp.get("stuId") ?? undefined,
		status: sp.get("status") !== null ? Number(sp.get("status")) : undefined,
		from: sp.get("from") ?? undefined,
		to: sp.get("to") ?? undefined,
	};
}

export default function FeedbackIndex({
	payload,
}: Readonly<{ payload: FeedbackIndexPayload }>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");

	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const currentPage = queryFromUrl.page ?? 1;
	const pageSize = queryFromUrl.pageSize ?? 10;
	const { rows, count: total } = payload.data;

	const filterFormApi = useRef<FormApi>(null);

	const updateSearchParams = (params: IFeedbackPageQueryData) => {
		const next = new URLSearchParams();
		if (params.page) next.set("page", String(params.page));
		if (params.pageSize) next.set("pageSize", String(params.pageSize));
		if (params.stuId) next.set("stuId", params.stuId);
		if (params.status) next.set("status", String(params.status));
		if (params.from) next.set("from", params.from);
		if (params.to) next.set("to", params.to);
		setLoading("table");
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	useEffect(() => {
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [payload.data]);

	const { canDelete } = useMemo(() => {
		const perms = payload.permissions;
		return {
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
			content: "确定要删除该问题反馈吗？该操作不可逆。",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteFeedbackByIdApi(id), "删除成功");
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
		const option = FeedbackStatusOptions.find((opt) => opt.value === status);
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
			title: "问题描述",
			dataIndex: "desc",
			key: "desc",
			ellipsis: true,
			width: 150,
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
			title: "学号",
			dataIndex: "stuId",
			key: "stuId",
			width: 120,
			render: (v?: string) => v || "未登录",
		},
		{
			title: "反馈时间",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 120,
			render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 140,
			render: (status: number) => renderStatusTag(status),
		},
		{
			title: "操作",
			key: "action",
			width: 150,
			fixed: "right" as const,
			render: (_: unknown, record: IFeedback) => (
				<Space>
					<Button
						theme="light"
						type="primary"
						onClick={() =>
							router.push(`/dashboard/weihuda/feedback/${record.id}`)
						}
						disabled={loading !== ""}
					>
						查看详情
					</Button>
					{canDelete && (
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
						学号: queryFromUrl.stuId ?? "",
						状态: queryFromUrl.status ?? undefined,
						开始时间: queryFromUrl.from
							? new Date(queryFromUrl.from)
							: undefined,
						结束时间: queryFromUrl.to ? new Date(queryFromUrl.to) : undefined,
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
							optionList={FeedbackStatusOptions}
							showClear
							className="w-48"
						/>
						<Form.DatePicker
							field="from"
							label="开始时间"
							placeholder="反馈开始时间"
							className="w-48"
							showClear
						/>
						<Form.DatePicker
							field="to"
							label="结束时间"
							placeholder="反馈结束时间"
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

			<Table
				columns={columns}
				dataSource={rows}
				rowKey="id"
				loading={loading === "table"}
				empty={<div>暂无问题反馈</div>}
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
				onRow={(record) => ({
					onClick: (e) => {
						if (!record) return;
						const target = e.target as HTMLElement;
						if (!target.closest("button")) {
							router.push(`/dashboard/weihuda/feedback/${record.id}`);
						}
					},
					style: { cursor: "pointer" },
				})}
			/>
		</div>
	);
}
