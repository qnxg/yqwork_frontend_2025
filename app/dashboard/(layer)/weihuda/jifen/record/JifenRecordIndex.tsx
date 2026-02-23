"use client";

import { Button, Card, Form, Modal, Space, Table } from "@douyinfe/semi-ui-19";
import { IconPlus } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
	postJifenRecordApi,
	type IJifenRecordPageResponseData,
	type IJifenRecordPageQueryData,
} from "@/api/weihuda/jifenRecord";
import { hasPermission } from "@/utils";
import { withToast } from "@/utils/action";
import { RequiredRule } from "@/utils/form";
import { useRefreshOnSearchParamsChange } from "@/utils/hooks";
import dayjs from "dayjs";

export interface JifenRecordIndexProps {
	initialData: IJifenRecordPageResponseData;
	permissions: string[];
}

function parseQueryFromSearchParams(
	sp: URLSearchParams,
): IJifenRecordPageQueryData {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
		key: sp.get("key") ?? undefined,
		param: sp.get("param") ?? undefined,
		stuId: sp.get("stuId") ?? undefined,
	};
}

const PERMISSION_PREFIX = "hdwsh:jifenRecord";

export default function JifenRecordIndex({
	initialData,
	permissions,
}: JifenRecordIndexProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [data, setData] = useState(initialData);
	const formApiRef = useRef<FormApi | null>(null);
	const filterFormApiRef = useRef<FormApi | null>(null);

	const { canAdd } = useMemo(() => {
		return {
			canAdd: hasPermission(permissions, `${PERMISSION_PREFIX}:add`),
		};
	}, [permissions]);

	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const { page: currentPage, pageSize } = queryFromUrl;
	const { rows, count: total } = data;

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setData(initialData);
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [initialData]);

	useRefreshOnSearchParamsChange(searchParams);

	const updateSearchParams = (params: IJifenRecordPageQueryData) => {
		const next = new URLSearchParams(searchParams.toString());
		if (params.page) next.set("page", String(params.page));
		if (params.pageSize) next.set("pageSize", String(params.pageSize));
		if (params.key != null) {
			if (params.key) next.set("key", params.key);
			else next.delete("key");
		}
		if (params.param != null) {
			if (params.param) next.set("param", params.param);
			else next.delete("param");
		}
		if (params.stuId != null) {
			if (params.stuId) next.set("stuId", params.stuId);
			else next.delete("stuId");
		}
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	const handleFilter = () => {
		if (!filterFormApiRef.current) return;
		const values = filterFormApiRef.current.getValues();
		setLoading("table");
		updateSearchParams({
			page: 1,
			pageSize,
			key: (values.key as string)?.trim() ?? "",
			param: (values.param as string)?.trim() ?? "",
			stuId: (values.stuId as string)?.trim() ?? "",
		});
	};

	const handleReset = () => {
		if (!filterFormApiRef.current) return;
		filterFormApiRef.current.reset();
		setLoading("table");
		updateSearchParams({
			page: 1,
			pageSize: 10,
			key: "",
			param: "",
			stuId: "",
		});
	};

	const handleOpenAddModal = () => setModalOpen(true);
	const handleCloseModal = () => {
		setModalOpen(false);
		formApiRef.current?.reset();
	};

	const handleSubmitAdd = async () => {
		if (!formApiRef.current) return;
		setLoading("submit");
		try {
			const values = await formApiRef.current.validate();
			await withToast(
				() =>
					postJifenRecordApi({
						stuId: values.stuId,
						desc: values.desc,
						jifen: Number(values.jifen),
					}),
				"添加成功",
			);
			handleCloseModal();
			router.refresh();
		} catch {}
		setLoading("");
	};

	const columns = [
		{ title: "序号", dataIndex: "id", key: "id", width: 80 },
		{ title: "key", dataIndex: "key", key: "key", width: 120 },
		{ title: "参数", dataIndex: "param", key: "param", width: 120 },
		{ title: "学号", dataIndex: "stuId", key: "stuId", width: 120 },
		{
			title: "描述",
			dataIndex: "desc",
			key: "desc",
			ellipsis: true,
			render: (v: string) => v || "-",
		},
		{ title: "积分", dataIndex: "jifen", key: "jifen", width: 80 },
		{
			title: "时间",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 160,
			render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
		},
	];

	return (
		<div>
			<Card className="mb-4">
				<h4 className="text-lg font-medium mb-4">筛选条件</h4>
				<Form
					getFormApi={(api) => (filterFormApiRef.current = api)}
					initValues={{
						key: queryFromUrl.key ?? "",
						param: queryFromUrl.param ?? "",
						stuId: queryFromUrl.stuId ?? "",
					}}
				>
					<Space wrap className="mb-4">
						<Form.Input
							field="key"
							label="key"
							placeholder="关键字筛选"
							className="w-48"
						/>
						<Form.Input
							field="param"
							label="参数"
							placeholder="关键字筛选"
							className="w-48"
						/>
						<Form.Input
							field="stuId"
							label="学号"
							placeholder="关键字筛选"
							className="w-48"
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
					icon={<IconPlus />}
					onClick={handleOpenAddModal}
				>
					新增
				</Button>
			)}

			<Table
				columns={columns}
				dataSource={rows}
				rowKey="id"
				loading={loading === "table"}
				empty={<div>暂无积分记录</div>}
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

			<Modal
				title="新增积分记录"
				visible={modalOpen}
				onCancel={handleCloseModal}
				onOk={handleSubmitAdd}
				okText="添加"
				cancelText="取消"
				confirmLoading={loading === "submit"}
			>
				<Form
					getFormApi={(api) => (formApiRef.current = api)}
					labelPosition="top"
				>
					<Form.Input
						field="stuId"
						label="学号"
						placeholder="请输入学号"
						rules={[RequiredRule]}
					/>
					<Form.Input
						field="desc"
						label="描述"
						placeholder="请输入描述"
						rules={[RequiredRule]}
					/>
					<Form.Input
						field="jifen"
						label="积分"
						placeholder="请输入积分（可正可负）"
						type="number"
						rules={[RequiredRule]}
					/>
				</Form>
			</Modal>
		</div>
	);
}
