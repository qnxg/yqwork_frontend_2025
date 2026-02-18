"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Space,
	Button,
	Table,
	Modal,
	Banner,
	Form,
	Card,
	Tag,
	Descriptions,
} from "@douyinfe/semi-ui-19";
import { DateTimeRender, StatusRender, WorkDetailRender } from "@/utils/table";
import {
	putWorkHoursRecordByIdApi,
	IWorkHoursRecord,
} from "@/api/qnxg/workHoursRecord";
import { IUser } from "@/api/qnxg/user";
import { WorkHourRecordStatusOptions } from "@/config/fields";
import { IWorkHours } from "@/api/qnxg/workHours";
import { IDepartment } from "@/api/qnxg/department";
import { IconCrossCircleStroked, IconStoryStroked } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { getTotalHours, getTotalSalary } from "@/utils";
import { withToast } from "@/utils/action";

export interface CheckWorkHoursRecordPayload {
	user: IUser;
	workHours: IWorkHours;
	workHoursRecords: IWorkHoursRecord[];
	departmentList: IDepartment[];
}

const CheckWorkHoursRecordIndex = ({
	payload,
}: {
	payload: CheckWorkHoursRecordPayload;
}) => {
	const router = useRouter();
	const [loading, setLoading] = useState("");

	const { user, workHours, workHoursRecords, departmentList } = payload;

	const [reviewModalVisible, setReviewModalVisible] = useState(false);
	const [currentRecord, setCurrentRecord] = useState<IWorkHoursRecord | null>(
		null,
	);
	const formApi = useRef<FormApi | null>(null);

	const isExpired = new Date(workHours.endTime) < new Date();

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
		setReviewModalVisible(true);
	};

	const handleSubmitReject = async () => {
		if (!formApi.current || !currentRecord) return;
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
					<div>{record.userInfo.info.name}</div>
					<div className="text-sm text-gray-500">
						{record.userInfo.info.stuId}
					</div>
				</div>
			),
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
			render: (_: unknown, record: IWorkHoursRecord) => (
				<span className="font-medium">{getTotalSalary(record)}元</span>
			),
			width: 100,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
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
					{!isExpired && record.status === 1 && (
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
					{record.status === 1 && (
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
			{workHours.comment && (
				<Banner
					type="info"
					title={<div>说明</div>}
					description={<div>{workHours.comment}</div>}
					closeIcon={null}
					fullMode={false}
					className="w-full mb-4"
				/>
			)}

			{isExpired && (
				<Banner
					type="warning"
					title={<div>已过期</div>}
					description={
						<div>
							{`当前已过工时申报截止时间：${DateTimeRender(workHours.endTime)}，无法批准申报。`}
						</div>
					}
					closeIcon={null}
					fullMode={false}
					className="w-full mb-4"
				/>
			)}

			<Card
				title={
					<Space>
						<h2>部门工时审核</h2>
						<Tag size="large">
							{departmentList.find((d) => d.id === user.info.departmentId)
								?.name || "未知部门"}
						</Tag>
					</Space>
				}
				className="mb-4"
			>
				<Descriptions column={3} align="plain">
					<Descriptions.Item itemKey="工时申报">
						{workHours.name}
					</Descriptions.Item>
					<Descriptions.Item itemKey="截止时间">
						{DateTimeRender(workHours.endTime)}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			<Table
				columns={columns}
				dataSource={workHoursRecords}
				loading={false}
				empty={<span>暂无申报记录</span>}
				expandedRowRender={(record?: IWorkHoursRecord) =>
					record ? WorkDetailRender(record) : null
				}
				rowKey="id"
			/>
			<Modal
				visible={reviewModalVisible}
				title={"打回申报"}
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

				<Form className="w-full" getFormApi={(api) => (formApi.current = api)}>
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

export default CheckWorkHoursRecordIndex;
