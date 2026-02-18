"use client";

import {
	Button,
	Card,
	Form,
	Modal,
	Space,
	Table,
	Tag,
} from "@douyinfe/semi-ui-19";
import { IconCheckCircleStroked, IconDelete } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
	deleteGoodsRecordByIdApi,
	getGoodsReceiveApi,
	getGoodsRecordPageApi,
	type IGoodsRecord,
	type IGoodsRecordPageResponseData,
	type IGoodsRecordPageQueryData,
} from "@/api/weihuda/goodsRecord";
import type { IJifenGoods } from "@/api/weihuda/jifenGoods";
import { GoodsRecordStatusOptions } from "@/config/fields";
import { hasPermission } from "@/utils";
import { withToast } from "@/utils/action";
import { useRefreshOnSearchParamsChange } from "@/utils/hooks";
import dayjs from "dayjs";

export interface JifenExchangeIndexProps {
	initialData: IGoodsRecordPageResponseData;
	goodsList: IJifenGoods[];
	permissions: string[];
	permissionPrefix: string;
}

function parseQueryFromSearchParams(
	sp: URLSearchParams,
): IGoodsRecordPageQueryData {
	const statusVal = sp.get("status");
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
		stuId: sp.get("stuId")?.trim() || undefined,
		goodsId: sp.get("goodsId") ? Number(sp.get("goodsId")) : undefined,
		status:
			statusVal != null && statusVal !== "" ? Number(statusVal) : undefined,
	};
}

export default function JifenExchangeIndex({
	initialData,
	goodsList,
	permissions,
	permissionPrefix,
}: JifenExchangeIndexProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");
	const [data, setData] = useState(initialData);
	const filterFormApiRef = useRef<FormApi | null>(null);

	useEffect(() => {
		setData(initialData);
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [initialData]);

	const canEdit = hasPermission(permissions, `${permissionPrefix}:edit`);
	const canDelete = hasPermission(permissions, `${permissionPrefix}:delete`);

	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const { page: currentPage, pageSize } = queryFromUrl;
	const { rows, count: total } = data;

	const goodsMap = new Map(goodsList.map((g) => [g.id, g.name]));

	useRefreshOnSearchParamsChange(searchParams);

	const updateSearchParams = (params: Partial<IGoodsRecordPageQueryData>) => {
		const next = new URLSearchParams(searchParams.toString());
		if (params.page != null) next.set("page", String(params.page));
		if (params.pageSize != null) next.set("pageSize", String(params.pageSize));
		if ("stuId" in params) {
			if (params.stuId) next.set("stuId", params.stuId);
			else next.delete("stuId");
		}
		if ("goodsId" in params) {
			if (params.goodsId != null) next.set("goodsId", String(params.goodsId));
			else next.delete("goodsId");
		}
		if ("status" in params) {
			if (params.status != null) next.set("status", String(params.status));
			else next.delete("status");
		}
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	const refreshData = async () => {
		setLoading("table");
		try {
			const res = await getGoodsRecordPageApi(queryFromUrl);
			setData(res);
		} finally {
			setLoading("");
		}
	};

	const handleFilter = () => {
		if (!filterFormApiRef.current) return;
		const values = filterFormApiRef.current.getValues();
		setLoading("table");
		updateSearchParams({
			page: 1,
			pageSize: queryFromUrl.pageSize,
			stuId: (values.stuId as string)?.trim() || undefined,
			goodsId: values.goodsId != null ? Number(values.goodsId) : undefined,
			status:
				values.status !== undefined && values.status !== null
					? Number(values.status)
					: undefined,
		});
	};

	const handleReset = () => {
		if (!filterFormApiRef.current) return;
		filterFormApiRef.current.reset();
		setLoading("table");
		updateSearchParams({
			page: 1,
			pageSize: 10,
			stuId: undefined,
			goodsId: undefined,
			status: undefined,
		});
	};

	const handleReceive = async (id: number) => {
		setLoading(`receive-${id}`);
		try {
			await withToast(() => getGoodsReceiveApi(id), "标记成功");
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleDelete = (id: number) => {
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该兑换记录吗？",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteGoodsRecordByIdApi(id), "删除成功");
					router.refresh();
					await refreshData();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	const renderStatusTag = (status: number) => {
		const option = GoodsRecordStatusOptions.find((opt) => opt.value === status);
		return option ? (
			<Tag color={option.color}>{option.label}</Tag>
		) : (
			<Tag color="grey">未知</Tag>
		);
	};

	const columns = [
		{ title: "序号", dataIndex: "id", key: "id", width: 50 },
		{ title: "学号", dataIndex: "stuId", key: "stuId", width: 120 },
		{
			title: "兑换奖品",
			dataIndex: "goodsId",
			key: "goodsId",
			width: 140,
			render: (goodsId: number) => {
				const name = goodsMap.get(goodsId);
				if (name) return `${name}（#${goodsId}）`;
				return `#${goodsId}`;
			},
		},
		{
			title: "兑换时间",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 120,
			render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 80,
			render: (v: number) => renderStatusTag(v),
		},
		{
			title: "收货时间",
			dataIndex: "receiveTime",
			key: "receiveTime",
			width: 120,
			render: (v: string | undefined) =>
				v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-",
		},
		{
			title: "操作",
			key: "action",
			width: 160,
			fixed: "right" as const,
			render: (_: unknown, record: IGoodsRecord) => (
				<Space>
					{canEdit && record.status !== 2 && (
						<Button
							theme="light"
							type="primary"
							icon={<IconCheckCircleStroked />}
							loading={loading === `receive-${record.id}`}
							onClick={() => handleReceive(record.id)}
							disabled={loading !== ""}
						>
							标记为已领取
						</Button>
					)}
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

	const goodsOptions = goodsList.map((g) => ({
		label: `${g.name}（#${g.id}）`,
		value: g.id,
	}));

	return (
		<div>
			<Card className="mb-4">
				<h4 className="text-lg font-medium mb-4">筛选条件</h4>
				<Form
					getFormApi={(api) => (filterFormApiRef.current = api)}
					initValues={{
						stuId: queryFromUrl.stuId ?? "",
						goodsId: queryFromUrl.goodsId ?? undefined,
						status: queryFromUrl.status ?? undefined,
					}}
				>
					<Space wrap className="mb-4">
						<Form.Input
							field="stuId"
							label="学号"
							placeholder="关键字筛选"
							className="w-48"
						/>
						<Form.Select
							field="goodsId"
							label="奖品"
							placeholder="请选择奖品"
							optionList={goodsOptions}
							showClear
							className="w-48"
						/>
						<Form.Select
							field="status"
							label="状态"
							placeholder="请选择状态"
							optionList={GoodsRecordStatusOptions}
							showClear
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

			<Table
				columns={columns}
				dataSource={rows}
				rowKey="id"
				loading={loading === "table"}
				empty={<div>暂无兑换记录</div>}
				pagination={{
					currentPage,
					pageSize,
					total,
					onChange: (newPage: number, newSize: number) => {
						setLoading("table");
						updateSearchParams({
							...queryFromUrl,
							page: newPage,
							pageSize: newSize,
						});
					},
				}}
			/>
		</div>
	);
}
