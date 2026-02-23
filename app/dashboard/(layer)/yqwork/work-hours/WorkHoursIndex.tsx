"use client";

import {
	IWorkHours,
	postWorkHoursApi,
	putWorkHoursByIdApi,
	deleteWorkHoursByIdApi,
	IWorkHoursBasicInfo,
} from "@/api/qnxg/workHours";
import { hasPermission } from "@/utils";
import { RequiredRule } from "@/utils/form";
import { IconEdit, IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { Button, Modal, Space, Table, Form } from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useState, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DateTimeRender, StatusRender } from "@/utils/table";
import { WorkHourStatusOptions } from "@/config/fields";
import dayjs from "dayjs";
import { withToast } from "@/utils/action";

export interface WorkHoursIndexPayload {
	list: IWorkHours[];
	total: number;
	permissions: string[];
	page: number;
	pageSize: number;
}

const PERMISSION_PREFIX = "yq:workHours";

function parsePageFromSearchParams(sp: URLSearchParams): {
	page: number;
	pageSize: number;
} {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
	};
}

export default function WorkHoursIndex({
	payload,
}: {
	payload: WorkHoursIndexPayload;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");

	const [showAdd, setShowAdd] = useState(false);
	const [showModify, setShowModify] = useState(false);
	const [editingData, setEditingData] = useState<IWorkHours | null>(null);
	const formApi = useRef<FormApi | null>(null);

	const { canAdd, canEdit, canDelete, canCheckDepartment, canGenerateTable } =
		useMemo(() => {
			const perms = payload.permissions;
			return {
				canAdd: hasPermission(perms, `${PERMISSION_PREFIX}:add`),
				canEdit: hasPermission(perms, `${PERMISSION_PREFIX}:edit`),
				canDelete: hasPermission(perms, `${PERMISSION_PREFIX}:delete`),
				canCheckDepartment: hasPermission(
					perms,
					`${PERMISSION_PREFIX}:checkDepartment`,
				),
				canGenerateTable: hasPermission(
					perms,
					`${PERMISSION_PREFIX}:generateTable`,
				),
			};
		}, [payload.permissions]);

	// 分页以 URL 为准
	const { page: urlPage, pageSize: urlPageSize } =
		parsePageFromSearchParams(searchParams);
	const { list: data, total } = payload;

	const updateSearchParams = (newPage: number, newPageSize: number) => {
		const next = new URLSearchParams();
		next.set("page", String(newPage));
		next.set("pageSize", String(newPageSize));
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	const columns = [
		{
			title: "序号",
			dataIndex: "id",
			width: 50,
		},
		{
			title: "名称",
			dataIndex: "name",
			width: 150,
		},
		{
			title: "截止时间",
			dataIndex: "endTime",
			width: 150,
			render: DateTimeRender,
		},
		{
			title: "状态",
			dataIndex: "status",
			width: 100,
			render: (_: number, record: IWorkHours) =>
				StatusRender(record.id, record.status, WorkHourStatusOptions),
		},
		{
			title: "备注",
			dataIndex: "comment",
			width: 200,
		},
		{
			title: "操作",
			render: (record: IWorkHours) => {
				return (
					<Space>
						<Button
							theme="light"
							type="primary"
							onClick={() =>
								router.push(`/dashboard/yqwork/work-hours/${record.id}/my`, {
									scroll: false,
								})
							}
						>
							我的申报
						</Button>
						{canCheckDepartment && (
							<Button
								theme="light"
								type="primary"
								onClick={() =>
									router.push(
										`/dashboard/yqwork/work-hours/${record.id}/check`,
										{
											scroll: false,
										},
									)
								}
							>
								审核
							</Button>
						)}
						{canGenerateTable && (
							<Button
								theme="light"
								type="primary"
								onClick={() =>
									router.push(`/dashboard/yqwork/work-hours/${record.id}/gen`, {
										scroll: false,
									})
								}
								disabled={loading !== ""}
							>
								制作工资表
							</Button>
						)}
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
								loading={loading === `delete ${record.id}`}
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
			const values = (await formApi.current!.validate()) as IWorkHoursBasicInfo;
			values.endTime = dayjs(values.endTime).format("YYYY-MM-DD HH:mm");
			await withToast(() => postWorkHoursApi(values), "添加成功");
			setShowAdd(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleModify = async () => {
		if (!formApi.current || !editingData) return;
		setLoading("update");
		try {
			const values = (await formApi.current!.validate()) as IWorkHoursBasicInfo;
			values.endTime = dayjs(values.endTime).format("YYYY-MM-DD HH:mm");
			await withToast(
				() => putWorkHoursByIdApi(editingData.id, values),
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
			content: "确定要删除该工时申报吗？该操作不可逆。",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete ${id}`);
				try {
					await withToast(() => deleteWorkHoursByIdApi(id), "删除成功");
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
					添加
				</Button>
			)}
			<Table
				columns={columns}
				dataSource={data}
				pagination={{
					pageSize: urlPageSize,
					currentPage: urlPage,
					total,
					onChange: (currentPage, newPageSize) => {
						updateSearchParams(currentPage, newPageSize);
					},
				}}
				loading={false}
			/>
			<Modal
				title="添加工时申报"
				visible={showAdd || showModify}
				onOk={() => formApi.current?.submitForm?.()}
				onCancel={() => {
					setShowAdd(false);
					setShowModify(false);
				}}
				okText={showModify ? "修改" : "添加"}
				cancelText={"取消"}
				confirmLoading={loading === "add" || loading === "update"}
			>
				<Form
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={showModify ? handleModify : handleAdd}
					initValues={showModify ? editingData! : undefined}
				>
					<Form.Input field="name" label={"名称"} rules={[RequiredRule]} />
					<Form.DatePicker
						field="endTime"
						label={"截止时间"}
						rules={[RequiredRule]}
						className="w-full"
						type="dateTime"
						format="yyyy-MM-dd HH:mm"
					/>
					<Form.Select
						field="status"
						label={"状态"}
						rules={[RequiredRule]}
						initValue={
							showModify ? editingData?.status : WorkHourStatusOptions[0].value
						}
						optionList={WorkHourStatusOptions}
						className="w-full"
					/>
					<Form.TextArea field="comment" label={"备注"} />
				</Form>
			</Modal>
		</div>
	);
}
