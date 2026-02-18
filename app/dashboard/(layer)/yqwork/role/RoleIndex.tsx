"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Table,
	Modal,
	Form,
	Space,
	Tag,
	Tree,
} from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { IconEdit, IconDelete, IconPlus } from "@douyinfe/semi-icons";
import type { TreeNodeData } from "@douyinfe/semi-ui-19/lib/es/tree";
import type { IPermission } from "@/api/qnxg/permission";
import {
	postRoleApi,
	putRoleByIdApi,
	deleteRoleByIdApi,
	IRole,
} from "@/api/qnxg/role";
import { hasPermission } from "@/utils";
import { RequiredRule } from "@/utils/form";
import { withToast } from "@/utils/action";
import {
	buildPermissionNodeMap,
	type PermissionNodeData,
} from "../permission/permissionTree";

const PERMISSION_PREFIX = "system:role";

/** 由 nodeMap 构建「按 id 多选」的树：实际节点 value=id 可勾选，虚节点 disabled */
function buildSelectionTreeData(
	nodeMap: Map<string, PermissionNodeData>,
): TreeNodeData[] {
	function getParent(key: string): string | null {
		const i = key.lastIndexOf(":");
		return i === -1 ? null : key.slice(0, i);
	}
	function build(parentKey: string | null): TreeNodeData[] {
		const items: TreeNodeData[] = [];
		for (const [key, data] of nodeMap) {
			if (getParent(key) !== parentKey) continue;
			const sub = build(key);
			items.push({
				key,
				label: data.name,
				value: data.id ?? key,
				disabled: data.isVirtual,
				children: sub.length > 0 ? sub : undefined,
			});
		}
		items.sort((a, b) => String(a.key).localeCompare(String(b.key)));
		return items;
	}
	return build(null);
}

export interface RoleIndexPayload {
	roles: IRole[];
	permissions: IPermission[];
	userPermissions: string[];
}

function collectPermissionIds(permissions: IPermission[]): number[] {
	return permissions.map((p) => p.id);
}

export default function RoleIndex({
	payload,
}: Readonly<{ payload: RoleIndexPayload }>) {
	const router = useRouter();
	const [loading, setLoading] = useState("");
	const [showAdd, setShowAdd] = useState(false);
	const [showEdit, setShowEdit] = useState(false);
	const [editingRole, setEditingRole] = useState<IRole | null>(null);
	const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
		[],
	);
	const [addFormKey, setAddFormKey] = useState(0);
	const formApi = useRef<FormApi | null>(null);

	const nodeMap = useMemo(
		() => buildPermissionNodeMap(payload.permissions),
		[payload.permissions],
	);
	const permissionTreeData = useMemo(
		() => buildSelectionTreeData(nodeMap),
		[nodeMap],
	);

	const { canAdd, canEdit, canDelete } = useMemo(() => {
		const perms = payload.userPermissions;
		return {
			canAdd: hasPermission(perms, `${PERMISSION_PREFIX}:post`),
			canEdit: hasPermission(perms, `${PERMISSION_PREFIX}:update`),
			canDelete: hasPermission(perms, `${PERMISSION_PREFIX}:delete`),
		};
	}, [payload.userPermissions]);

	const openAdd = () => {
		setEditingRole(null);
		setSelectedPermissionIds([]);
		setAddFormKey((k) => k + 1);
		setShowAdd(true);
	};

	const openEdit = (role: IRole) => {
		setEditingRole(role);
		setSelectedPermissionIds(collectPermissionIds(role.permissions));
		setShowEdit(true);
	};

	const handleAdd = async () => {
		if (!formApi.current) return;
		setLoading("add");
		try {
			const values = (await formApi.current.validate()) as {
				name: string;
			};
			await withToast(
				() =>
					postRoleApi({
						name: values.name,
						permissionIds: selectedPermissionIds,
					}),
				"添加角色成功",
			);
			setShowAdd(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleEdit = async () => {
		if (!formApi.current || !editingRole) return;
		setLoading("edit");
		try {
			const values = (await formApi.current.validate()) as { name: string };
			await withToast(
				() =>
					putRoleByIdApi(editingRole.id, {
						name: values.name,
						permissionIds: selectedPermissionIds,
					}),
				"修改角色成功",
			);
			setShowEdit(false);
			setEditingRole(null);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleDelete = (role: IRole) => {
		Modal.confirm({
			title: "确认删除",
			content: `确定要删除角色「${role.name}」吗？该操作不可逆。`,
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${role.id}`);
				try {
					await withToast(() => deleteRoleByIdApi(role.id), "删除成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	/** Tree 多选时 onChange 的 value 类型：可能是数组、单个值或 undefined，元素可能是 number（权限 id）、string（虚节点 key）或 TreeNodeData */
	type TreeValue =
		| string
		| number
		| TreeNodeData
		| Array<TreeNodeData | number | string>;
	const onPermissionTreeChange = (value?: TreeValue) => {
		// 先统一成数组，再只保留 number（实际权限 id），用于提交 permissionIds；虚节点为 string、对象等会被过滤掉
		const arr = Array.isArray(value)
			? value
			: value !== undefined && value !== null
				? [value]
				: [];
		const ids = arr.filter((v): v is number => typeof v === "number");
		setSelectedPermissionIds(ids);
	};

	const columns = [
		{
			title: "序号",
			dataIndex: "id",
			width: 80,
		},
		{
			title: "角色名称",
			dataIndex: "name",
			width: 160,
		},
		{
			title: "权限",
			key: "permissions",
			render: (_: unknown, record: IRole) => (
				<Space wrap>
					{record.permissions.length === 0 ? (
						<span className="text-[var(--semi-color-text-3)]">无</span>
					) : (
						record.permissions.map((p) => (
							<Tag key={p.id} size="small">
								{p.name}
							</Tag>
						))
					)}
				</Space>
			),
		},
		{
			title: "操作",
			key: "action",
			width: 180,
			render: (_: unknown, record: IRole) => (
				<Space>
					{canEdit && (
						<Button
							theme="light"
							type="secondary"
							icon={<IconEdit />}
							onClick={() => openEdit(record)}
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
							onClick={() => handleDelete(record)}
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
			{canAdd && (
				<Button
					theme="solid"
					type="warning"
					className="mb-4"
					onClick={openAdd}
					icon={<IconPlus />}
				>
					添加角色
				</Button>
			)}
			<Table
				columns={columns}
				dataSource={payload.roles}
				pagination={false}
				loading={loading === "table"}
				rowKey="id"
			/>
			<Modal
				title="添加角色"
				visible={showAdd}
				onOk={() => formApi.current?.submitForm?.()}
				onCancel={() => setShowAdd(false)}
				okText="添加"
				cancelText="取消"
				confirmLoading={loading === "add"}
				width={520}
			>
				<Form
					key={`add-${addFormKey}`}
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={handleAdd}
				>
					<Form.Input
						field="name"
						label="角色名称"
						rules={[RequiredRule]}
						placeholder="如：管理员"
					/>
					<Form.Slot label="权限">
						<div className="border border-[var(--semi-color-border)] rounded-md p-2 max-h-[320px] overflow-auto">
							<Tree
								treeData={permissionTreeData}
								multiple
								showLine
								blockNode
								value={selectedPermissionIds}
								onChange={onPermissionTreeChange}
								disableStrictly
							/>
						</div>
					</Form.Slot>
				</Form>
			</Modal>
			<Modal
				title="修改角色"
				visible={showEdit}
				onOk={() => formApi.current?.submitForm?.()}
				onCancel={() => {
					setShowEdit(false);
					setEditingRole(null);
				}}
				okText="修改"
				cancelText="取消"
				confirmLoading={loading === "edit"}
				width={520}
			>
				<Form
					key={editingRole?.id ?? "edit"}
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={handleEdit}
					initValues={editingRole ? { name: editingRole.name } : undefined}
				>
					<Form.Input
						field="name"
						label="角色名称"
						rules={[RequiredRule]}
						placeholder="如：管理员"
					/>
					<Form.Slot label="权限">
						<div className="border border-[var(--semi-color-border)] rounded-md p-2 max-h-[320px] overflow-auto">
							<Tree
								treeData={permissionTreeData}
								multiple
								showLine
								blockNode
								value={selectedPermissionIds}
								onChange={onPermissionTreeChange}
								disableStrictly
							/>
						</div>
					</Form.Slot>
				</Form>
			</Modal>
		</div>
	);
}
