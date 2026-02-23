"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Space,
	Button,
	Table,
	Modal,
	Form,
	Card,
	Descriptions,
} from "@douyinfe/semi-ui-19";
import { StatusRender, WorkDetailRender } from "@/utils/table";
import {
	putWorkHoursRecordByIdApi,
	IWorkHoursRecord,
	oneKeyApi,
} from "@/api/qnxg/workHoursRecord";
import { WorkHourRecordStatusOptions } from "@/config/fields";
import { IconCrossCircleStroked, IconStoryStroked } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { GenWorkHoursRecordPayload } from "../config";
import { getTotalHours, getTotalSalary } from "@/utils";
import Chart from "./Chart";
import { WAGE_PER_HOUR } from "@/config";
import { withToast } from "@/utils/action";

const GenWorkHoursAudit = ({
	payload,
}: {
	payload: GenWorkHoursRecordPayload;
}) => {
	const { workHours, workHoursRecords: initialRecords, statistics } = payload;
	const router = useRouter();
	const [workHoursRecords, setWorkHoursRecords] =
		useState<IWorkHoursRecord[]>(initialRecords);
	const [loading, setLoading] = useState("");
	const [reviewModalVisible, setReviewModalVisible] = useState(false);
	const [currentRecord, setCurrentRecord] = useState<IWorkHoursRecord | null>(
		null,
	);
	const formApi = useRef<FormApi | null>(null);

	useEffect(() => {
		setWorkHoursRecords(initialRecords);
	}, [initialRecords]);

	const isExpired = new Date(workHours.endTime) < new Date();

	// 计算统计数据
	const totalDepartments = statistics.length;
	const totalRecords = statistics.reduce(
		(sum, item) => sum + item.stats.count,
		0,
	);
	const totalHours = statistics.reduce(
		(sum, item) => sum + item.stats.totalHours,
		0,
	);
	const totalSalary = totalHours * WAGE_PER_HOUR;

	const handleGive = async (record: IWorkHoursRecord) => {
		setLoading(`give ${record.id}`);
		try {
			await withToast(
				() =>
					putWorkHoursRecordByIdApi({
						status: record.status + 1,
						workHourId: workHours.id,
						userId: record.userId,
					}),
				"发放成功",
			);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleAccept = async (record: IWorkHoursRecord) => {
		setLoading(`ac ${record.id}`);
		try {
			await withToast(
				() =>
					putWorkHoursRecordByIdApi({
						status: record.status + 1,
						workHourId: workHours.id,
						userId: record.userId,
					}),
				"批准成功",
			);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleReject = (record: IWorkHoursRecord) => {
		setCurrentRecord(record);
		if (formApi.current) {
			formApi.current.reset();
		}
		setReviewModalVisible(true);
	};

	const handleSubmitReject = async () => {
		if (!currentRecord || !formApi.current) return;

		setLoading("reject");
		try {
			const values = await formApi.current!.validate();
			await withToast(
				() =>
					putWorkHoursRecordByIdApi({
						status: 0,
						workHourId: workHours.id,
						userId: currentRecord.userId,
						comment: values.rejectReason,
					}),
				"打回成功",
			);
			setReviewModalVisible(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const columns = [
		{
			title: "序号",
			dataIndex: "index",
			key: "index",
			render: (_: unknown, record: IWorkHoursRecord) => record.id,
		},
		{
			title: "用户信息",
			dataIndex: "userInfo",
			key: "userInfo",
			render: (_: unknown, record: IWorkHoursRecord) => (
				<div>
					<div>{record.userInfo?.info?.name || "未知"}</div>
					<div className="text-sm text-gray-500">
						{record.userInfo?.info?.stuId || "未知"}
					</div>
				</div>
			),
		},
		{
			title: "部门",
			dataIndex: "department",
			key: "department",
			render: (_: unknown, record: IWorkHoursRecord) => {
				const department = payload.departmentList.find(
					(dep) => dep.id === record.userInfo.info.departmentId,
				);
				return department?.name || "未知";
			},
			width: 150,
		},
		{
			title: "岗位",
			dataIndex: "gangwei",
			key: "gangwei",
			render: (_: unknown, record: IWorkHoursRecord) =>
				record.userInfo.info.gangwei,
			width: 200,
		},
		{
			title: "总工时",
			dataIndex: "totalHours",
			key: "totalHours",
			render: (_: unknown, record: IWorkHoursRecord) => getTotalHours(record),
			width: 80,
		},
		{
			title: "参考工资",
			dataIndex: "totalSalary",
			key: "totalSalary",
			sorter: (a?: IWorkHoursRecord, b?: IWorkHoursRecord) =>
				getTotalSalary(b!) - getTotalSalary(a!),
			render: (_: unknown, record: IWorkHoursRecord) => (
				<span className="font-medium">{getTotalSalary(record)}元</span>
			),
			width: 100,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			filters: WorkHourRecordStatusOptions.map((item) => ({
				text: item.label,
				value: item.value,
			})),
			onFilter: (value: number, record?: IWorkHoursRecord) =>
				record!.status === value,
			render: (_: unknown, record: IWorkHoursRecord) =>
				StatusRender(record.id, record.status, WorkHourRecordStatusOptions),
			width: 100,
		},
		{
			title: "操作",
			dataIndex: "action",
			key: "action",
			render: (_: unknown, record: IWorkHoursRecord) => (
				<Space>
					{!isExpired && record.status === 2 && (
						<Button
							theme="light"
							type="primary"
							icon={<IconStoryStroked />}
							onClick={() => handleAccept(record)}
							loading={loading === `ac ${record.id}`}
							disabled={loading !== ""}
						>
							同意
						</Button>
					)}
					{record.status === 3 && (
						<Button
							theme="light"
							type="secondary"
							icon={<IconStoryStroked />}
							onClick={() => handleGive(record)}
							loading={loading === `give ${record.id}`}
							disabled={loading !== ""}
						>
							发放
						</Button>
					)}
					{record.status === 2 && (
						<Button
							theme="light"
							type="danger"
							icon={<IconCrossCircleStroked />}
							onClick={() => handleReject(record)}
							loading={loading === "reject"}
							disabled={loading !== ""}
						>
							打回
						</Button>
					)}
				</Space>
			),
			width: 160,
		},
	];

	return (
		<div>
			{/* 统计数据 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
				<div className="bg-white rounded-lg border p-4">
					<div className="text-sm text-gray-500 mb-1">参与部门数</div>
					<div className="text-2xl font-bold">{totalDepartments}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="text-sm text-gray-500 mb-1">总申报数量</div>
					<div className="text-2xl font-bold">{totalRecords}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="text-sm text-gray-500 mb-1">总申报工时</div>
					<div className="text-2xl font-bold">{totalHours}小时</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="text-sm text-gray-500 mb-1">总申报工资</div>
					<div className="text-2xl font-bold">{totalSalary}元</div>
				</div>
			</div>
			{/* 部门统计图表 */}
			<Card className="mb-6">
				<h4 className="text-md font-medium mb-4">部门统计图表</h4>
				<Chart stats={statistics} />
			</Card>

			<div className="flex">
				<Space className="ml-auto">
					<Button
						theme="light"
						type="primary"
						onClick={async () => {
							setLoading("ac all");
							try {
								await withToast(
									() => oneKeyApi(workHours.id, 3),
									"同意全部成功",
								);
								router.refresh();
							} catch {}
							setLoading("");
						}}
						loading={loading === "ac all"}
						disabled={loading !== ""}
					>
						同意全部
					</Button>
					<Button
						theme="light"
						type="primary"
						onClick={async () => {
							setLoading("give all");
							try {
								await withToast(
									() => oneKeyApi(workHours.id, 4),
									"发放全部成功",
								);
								router.refresh();
							} catch {}
							setLoading("");
						}}
						loading={loading === "give all"}
						disabled={loading !== ""}
					>
						发放全部
					</Button>
				</Space>
			</div>

			{/* 审核表格 */}
			<Table
				columns={columns}
				dataSource={workHoursRecords}
				loading={false}
				empty={<span>暂无申报记录</span>}
				expandedRowRender={(record?: IWorkHoursRecord) =>
					record && WorkDetailRender(record)
				}
				rowKey="id"
			/>
			{/* 打回模态框 */}
			<Modal
				visible={reviewModalVisible}
				title="打回申报"
				onCancel={() => setReviewModalVisible(false)}
				onOk={() => handleSubmitReject()}
				okText="确定"
				cancelText="取消"
				loading={loading === "reject"}
			>
				<Descriptions layout="vertical" align="plain">
					<Descriptions.Item itemKey="用户">
						{currentRecord?.userInfo?.info?.name || "未知"}
					</Descriptions.Item>
					<Descriptions.Item itemKey="学号">
						{currentRecord?.userInfo?.info?.stuId || "未知"}
					</Descriptions.Item>
					<Descriptions.Item itemKey="总工时">
						{currentRecord ? getTotalHours(currentRecord) : 0}小时
					</Descriptions.Item>
					<Descriptions.Item itemKey="参考工资">
						{currentRecord ? getTotalSalary(currentRecord) : 0}元
					</Descriptions.Item>
				</Descriptions>

				<Form
					className="w-full mt-4"
					getFormApi={(api) => (formApi.current = api)}
				>
					<Form.TextArea
						field="rejectReason"
						placeholder="请输入打回理由"
						className="w-full"
						rows={4}
						label="打回理由"
						rules={[{ required: true, message: "请填写打回理由" }]}
					/>
				</Form>
			</Modal>
		</div>
	);
};

export default GenWorkHoursAudit;
