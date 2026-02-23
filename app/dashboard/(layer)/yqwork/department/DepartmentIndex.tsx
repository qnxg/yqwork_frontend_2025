"use client";

import {
	deleteDepartmentByIdApi,
	IDepartment,
	IDepartmentBasicInfo,
	postDepartmentApi,
	putDepartmentByIdApi,
} from "@/api/qnxg/department";
import { IconEdit, IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { Button, Modal, Space, Form, Table } from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RequiredRule } from "@/utils/form";
import { hasPermission } from "@/utils";
import { withToast } from "@/utils/action";

const PERMISSION_PREFIX = "yq:department";

export interface DepartmentIndexPayload {
	departments: IDepartment[];
	permissions: string[];
}

export default function DepartmentIndex({
	payload,
}: Readonly<{
	payload: DepartmentIndexPayload;
}>) {
	const router = useRouter();
	const [loading, setLoading] = useState("");

	const [showAdd, setShowAdd] = useState(false);
	const [showModify, setShowModify] = useState(false);
	const [editingData, setEditingData] = useState<IDepartment | null>(null);
	const formApi = useRef<FormApi | null>(null);

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
			title: "序号",
			dataIndex: "id",
			width: 50,
		},
		{
			title: "部门名称",
			dataIndex: "name",
			width: 200,
		},
		{
			title: "部门简介",
			dataIndex: "desc",
			width: 200,
		},
		{
			title: "操作",
			fixed: "right" as const,
			width: 200,
			render: (record: IDepartment) => {
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
			const values =
				(await formApi.current!.validate()) as IDepartmentBasicInfo;
			await withToast(() => postDepartmentApi(values), "添加成功");
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
				(await formApi.current!.validate()) as IDepartmentBasicInfo;
			await withToast(
				() => putDepartmentByIdApi(editingData.id, values),
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
			content: "确定要删除该部门吗？该操作不可逆。",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete ${id}`);
				try {
					await withToast(() => deleteDepartmentByIdApi(id), "删除成功");
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
				dataSource={payload.departments}
				pagination={false}
				loading={false}
			/>
			<Modal
				title="添加部门"
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
					<Form.Input field="name" label={"部门名称"} rules={[RequiredRule]} />
					<Form.Input field="desc" label={"部门简介"} rules={[RequiredRule]} />
				</Form>
			</Modal>
		</div>
	);
}
