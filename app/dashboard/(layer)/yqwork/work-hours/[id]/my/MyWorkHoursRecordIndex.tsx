"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
	Card,
	Space,
	Button,
	InputNumber,
	Input,
	Table,
	Tag,
	Toast,
	Banner,
} from "@douyinfe/semi-ui-19";
import { IconPlus, IconDelete } from "@douyinfe/semi-icons";
import { DateTimeRender, StatusRender } from "@/utils/table";
import {
	putMyWorkHoursRecordApi,
	IWorkDescItem,
	IWorkHoursRecord,
	IWorkHoursIncludeItem,
} from "@/api/qnxg/workHoursRecord";
import { IUser } from "@/api/qnxg/user";
import { WorkHourRecordStatusOptions } from "@/config/fields";
import { IWorkHours } from "@/api/qnxg/workHours";
import { WAGE_PER_HOUR } from "@/config";
import { withToast } from "@/utils/action";

export interface MyWorkHoursRecordPayload {
	user: IUser;
	record: IWorkHoursRecord | null;
	workHours: IWorkHours;
	permissions: string[];
}

// 给 IWorkDescItem 添加一个 _localId 字段，用于 Table 的 rowKey，防止表单数据与表格渲染不同步
type LocalWorkDescItem = IWorkDescItem & { _localId: string };

/** 组字（中文输入法等）期间不向父级同步，避免受控值刷新打断 IME */
function WorkDescFieldInput({
	value,
	disabled,
	onCommit,
}: {
	value: string;
	disabled: boolean;
	onCommit: (v: string) => void;
}) {
	const [inner, setInner] = useState(value);
	const composingRef = useRef(false);

	// 父级 value 与本地 inner 在输入过程中由 onChange / compositionEnd 对齐；保存后整表重载时会 remount

	return (
		<Input
			value={inner}
			onChange={(v) => {
				setInner(v);
				if (!composingRef.current) {
					onCommit(v);
				}
			}}
			onCompositionStart={() => {
				composingRef.current = true;
			}}
			onCompositionEnd={(e) => {
				composingRef.current = false;
				const v = e.currentTarget.value;
				setInner(v);
				onCommit(v);
			}}
			placeholder="请输入工作描述"
			className="w-[300px]"
			disabled={disabled}
		/>
	);
}

const MyWorkHoursRecordIndex = ({
	payload,
}: {
	payload: MyWorkHoursRecordPayload;
}) => {
	const { user, record, workHours } = payload;
	const [currentWorkHoursRecord, setCurrentWorkHoursRecord] = useState(record);

	// 给 IWorkDescItem 添加唯一的 _localId
	// workDescId 从 0 开始下发，
	const workDescIdRef = useRef(0);
	const createLocalWorkDescItem = useCallback(
		(item: IWorkDescItem): LocalWorkDescItem => ({
			...item,
			_localId: `work-desc-${workDescIdRef.current++}`,
		}),
		[],
	);
	const [workDescs, setWorkDescs] = useState<LocalWorkDescItem[]>(() =>
		(currentWorkHoursRecord?.workDescs || []).map((item) =>
			createLocalWorkDescItem(item),
		),
	);

	const [loading, setLoading] = useState(false);

	const unEditable =
		(currentWorkHoursRecord && currentWorkHoursRecord.status !== 0) ||
		new Date(workHours.endTime) < new Date();

	const handleAddWorkDesc = useCallback(() => {
		setWorkDescs((prev) => [
			...prev,
			createLocalWorkDescItem({ desc: "", hour: 1 }),
		]);
	}, [createLocalWorkDescItem]);

	const handleDeleteWorkDesc = useCallback((index: number) => {
		setWorkDescs((prev) => {
			const next = [...prev];
			next.splice(index, 1);
			return next;
		});
	}, []);

	const handleWorkDescChange = useCallback(
		(index: number, field: keyof IWorkDescItem, value: string | number) => {
			setWorkDescs((prev) => {
				const next = [...prev];
				next[index] = { ...next[index], [field]: value };
				return next;
			});
		},
		[],
	);

	const handleSave = async () => {
		const hasEmptyDesc = workDescs.some((item) => !item.desc.trim());
		if (hasEmptyDesc) {
			Toast.error("请填写所有工作描述");
			return;
		}
		const hasInvalidHour = workDescs.some((item) => item.hour <= 0);
		if (hasInvalidHour) {
			Toast.error("工作时长必须大于0");
			return;
		}
		setLoading(true);
		try {
			const updatedRecord = await withToast(
				() =>
					putMyWorkHoursRecordApi(
						workHours.id,
						// 把 LocalWorkDescItem 转换为 IWorkDescItem
						workDescs.map(({ desc, hour }) => ({ desc, hour })),
					),
				"保存成功",
			);
			if (!updatedRecord) return;
			setCurrentWorkHoursRecord(updatedRecord);
		} catch {}
		setLoading(false);
	};

	const columns = useMemo(
		() => [
			{
				title: "序号",
				dataIndex: "index",
				key: "index",
				render: (_: unknown, __: unknown, index: number) => index + 1,
				width: 60,
			},
			{
				title: "工作描述",
				dataIndex: "desc",
				key: "desc",
				render: (_: unknown, record: LocalWorkDescItem, index: number) => (
					<WorkDescFieldInput
						value={record.desc}
						disabled={unEditable}
						onCommit={(v) => handleWorkDescChange(index, "desc", v)}
					/>
				),
			},
			{
				title: "工作时长（小时）",
				dataIndex: "hour",
				key: "hour",
				render: (_: unknown, record: LocalWorkDescItem, index: number) => (
					<InputNumber
						value={record.hour}
						onChange={(value) =>
							handleWorkDescChange(index, "hour", value || 0)
						}
						min={1}
						step={1}
						precision={0}
						className="w-[100px]"
						disabled={unEditable}
					/>
				),
			},
			{
				title: "参考工资（元）",
				dataIndex: "salary",
				key: "salary",
				render: (_: unknown, record: LocalWorkDescItem) => (
					<span>{(record.hour * WAGE_PER_HOUR).toFixed(0)}</span>
				),
				width: 120,
			},
			{
				title: "操作",
				dataIndex: "action",
				key: "action",
				render: (_: unknown, __: unknown, index: number) =>
					!unEditable && (
						<Button
							theme="light"
							type="danger"
							icon={<IconDelete />}
							onClick={() => handleDeleteWorkDesc(index)}
						>
							删除
						</Button>
					),
				width: 100,
			},
		],
		[unEditable, handleWorkDescChange, handleDeleteWorkDesc],
	);

	const totalHours = workDescs.reduce((sum, item) => sum + item.hour, 0);
	const totalSalary = totalHours * WAGE_PER_HOUR;
	const includedTotalHours =
		currentWorkHoursRecord?.includes?.reduce(
			(sum, item) => sum + item.hour,
			0,
		) || 0;
	const includedTotalSalary = includedTotalHours * WAGE_PER_HOUR;

	return (
		<div className="p-5">
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

			{currentWorkHoursRecord?.includes &&
				currentWorkHoursRecord.includes.length > 0 && (
					<Banner
						type="info"
						title={<div>工资说明</div>}
						description={
							<div>
								您的总发放工资包括两部分：您自己申报的工时工资和您包含的其他用户的工时工资。
								<br />
								总发放工资 = 个人申报工资 + 包含用户工资。
								<br />
								请在收到工资后将包含的其他用户的工资转账给对应的用户。
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
						<h2>我的工时申报</h2>
						<Tag size="large">
							{user.info.name} - {user.info.stuId}
						</Tag>
					</Space>
				}
				className="mb-4"
			>
				<Space vertical className="w-full items-start">
					<div className="flex items-center">
						<div>
							<span className="mr-5">
								状态：
								{StatusRender(
									currentWorkHoursRecord?.id || 0,
									currentWorkHoursRecord?.status || 0,
									WorkHourRecordStatusOptions,
								)}
							</span>
						</div>
						<Button
							type="primary"
							icon={<IconPlus />}
							onClick={handleAddWorkDesc}
							disabled={unEditable}
						>
							添加工作项
						</Button>
					</div>

					{currentWorkHoursRecord?.comment && (
						<Banner
							type="warning"
							title={<div>申报被打回</div>}
							description={
								<div>{`理由：${currentWorkHoursRecord.comment}`}</div>
							}
							closeIcon={null}
							fullMode={false}
							className="w-full"
						/>
					)}

					{new Date(workHours.endTime) < new Date() && (
						<Banner
							type="warning"
							title={<div>已过期</div>}
							description={
								<div>
									{`当前已过工时申报截止时间：${DateTimeRender(workHours.endTime)}，无法继续申报。`}
								</div>
							}
							closeIcon={null}
							fullMode={false}
							className="w-full"
						/>
					)}

					<Table
						columns={columns}
						dataSource={workDescs}
						rowKey="_localId"
						pagination={false}
						empty={<span>暂无工作项，请点击添加工作项</span>}
					/>

					<div className="flex items-center mt-5">
						<div className="ml-auto">
							<Button
								type="primary"
								onClick={handleSave}
								loading={loading}
								disabled={unEditable || workDescs.length === 0 || loading}
							>
								保存申报
							</Button>
							<Space className="ml-5">
								<span>总工时：{totalHours.toFixed(0)} 小时</span>
								<span>总参考工资：{totalSalary.toFixed(0)} 元</span>
							</Space>
						</div>
					</div>
				</Space>
			</Card>

			{currentWorkHoursRecord?.includes &&
				currentWorkHoursRecord.includes.length > 0 && (
					<Card
						title={
							<Space>
								<h2>包含的工时申报</h2>
								<Tag size="large" color="blue">
									共 {currentWorkHoursRecord.includes.length} 人
								</Tag>
							</Space>
						}
					>
						<Table
							columns={[
								{
									title: "序号",
									dataIndex: "index",
									key: "index",
									render: (_: unknown, __: unknown, index: number) => index + 1,
									width: 60,
								},
								{
									title: "用户信息",
									dataIndex: "user",
									key: "user",
									render: (_: unknown, record: IWorkHoursIncludeItem) => (
										<div>
											<div>{record.user!.info.name}</div>
											<div className="text-sm text-gray-500">
												{record.user!.info.stuId}
											</div>
										</div>
									),
								},
								{
									title: "包含工时（小时）",
									dataIndex: "hour",
									key: "hour",
									render: (_: unknown, record: IWorkHoursIncludeItem) =>
										record.hour,
									width: 120,
								},
								{
									title: "参考工资（元）",
									dataIndex: "salary",
									key: "salary",
									render: (_: unknown, record: IWorkHoursIncludeItem) =>
										(record.hour * WAGE_PER_HOUR).toFixed(0),
									width: 120,
								},
							]}
							dataSource={currentWorkHoursRecord.includes}
							pagination={false}
						/>

						<div className="flex items-center mt-5">
							<Space>
								<span className="font-medium">
									包含总工时：{includedTotalHours.toFixed(0)} 小时
								</span>
								<span className="font-medium">
									包含总工资：{includedTotalSalary.toFixed(0)} 元
								</span>
							</Space>
						</div>
					</Card>
				)}
		</div>
	);
};

export default MyWorkHoursRecordIndex;
