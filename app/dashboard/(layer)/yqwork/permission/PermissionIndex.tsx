"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Tree, Modal, Form, Space, Tag } from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { IconEdit, IconDelete, IconPlus } from "@douyinfe/semi-icons";
import type { TreeNodeData } from "@douyinfe/semi-ui-19/lib/es/tree";
import {
	postPermissionApi,
	putPermissionByIdApi,
	deletePermissionByIdApi,
	IPermission,
	IPermissionBasicInfo,
} from "@/api/qnxg/permission";
import { hasPermission } from "@/utils";
import { RequiredRule } from "@/utils/form";
import { withToast } from "@/utils/action";
import {
	buildPermissionNodeMap,
	permissionNodeMapToTreeData,
	type PermissionNodeData,
	type PermissionTreeNodeData,
} from "./permissionTree";

const PERMISSION_PREFIX = "system:permission";

export interface PermissionIndexPayload {
	permissions: IPermission[];
	userPermissions: string[];
}

export default function PermissionIndex({
	payload,
}: Readonly<{ payload: PermissionIndexPayload }>) {
	const router = useRouter();
	const [loading, setLoading] = useState("");
	const [showAdd, setShowAdd] = useState(false);
	const [showEdit, setShowEdit] = useState(false);
	const [editingNode, setEditingNode] = useState<PermissionNodeData | null>(
		null,
	);
	const formApi = useRef<FormApi | null>(null);

	const nodeMap = useMemo(
		() => buildPermissionNodeMap(payload.permissions),
		[payload.permissions],
	);
	const treeData = useMemo(
		() => permissionNodeMapToTreeData(nodeMap),
		[nodeMap],
	);

	const { canAdd, canEdit, canDelete } = useMemo(() => {
		const perms = payload.userPermissions;
		return {
			canAdd: hasPermission(perms, `${PERMISSION_PREFIX}:add`),
			canEdit: hasPermission(perms, `${PERMISSION_PREFIX}:edit`),
			canDelete: hasPermission(perms, `${PERMISSION_PREFIX}:delete`),
		};
	}, [payload.userPermissions]);

	const handleAdd = async () => {
		if (!formApi.current) return;
		setLoading("add");
		try {
			const values = (await formApi.current.validate()) as IPermissionBasicInfo;
			await withToast(() => postPermissionApi(values), "添加权限成功");
			setShowAdd(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleEdit = async () => {
		if (!formApi.current || !editingNode?.id) return;
		setLoading("edit");
		try {
			const values = (await formApi.current.validate()) as IPermissionBasicInfo;
			await withToast(
				() => putPermissionByIdApi(editingNode.id!, values),
				"修改权限成功",
			);
			setShowEdit(false);
			setEditingNode(null);
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleDelete = (node: PermissionNodeData) => {
		if (node.isVirtual || node.id == null) return;
		Modal.confirm({
			title: "确认删除",
			content: `确定要删除权限「${node.name}」吗？该操作不可逆。`,
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${node.id}`);
				try {
					await withToast(() => deletePermissionByIdApi(node.id!), "删除成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	const renderLabel = (label: React.ReactNode, data?: TreeNodeData) => {
		const node = data
			? (data as PermissionTreeNodeData).permissionNode
			: undefined;
		if (!node) return label;
		const isVirtual = node.isVirtual;
		const showEditBtn = canEdit && !isVirtual && node.id != null;
		const showDeleteBtn = canDelete && !isVirtual && node.id != null;
		return (
			<div className="flex items-center justify-between gap-2 w-full pr-2">
				<span className="flex items-center gap-2 min-w-0">
					<span className="truncate">{label}</span>
					{isVirtual && (
						<Tag size="small" color="grey">
							虚节点
						</Tag>
					)}
				</span>
				{(showEditBtn || showDeleteBtn) && (
					<div
						className="flex-shrink-0"
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
					>
						<Space>
							{showEditBtn && (
								<Button
									theme="borderless"
									type="secondary"
									size="small"
									icon={<IconEdit />}
									onClick={() => {
										setEditingNode(node);
										setShowEdit(true);
									}}
									disabled={loading !== ""}
								>
									编辑
								</Button>
							)}
							{showDeleteBtn && (
								<Button
									theme="borderless"
									type="danger"
									size="small"
									icon={<IconDelete />}
									onClick={() => handleDelete(node)}
									loading={loading === `delete-${node.id}`}
									disabled={loading !== ""}
								>
									删除
								</Button>
							)}
						</Space>
					</div>
				)}
			</div>
		);
	};

	return (
		<div>
			{canAdd && (
				<Button
					theme="solid"
					type="warning"
					onClick={() => setShowAdd(true)}
					icon={<IconPlus />}
				>
					添加权限
				</Button>
			)}
			<Tree
				className="min-h-[320px]"
				treeData={treeData}
				showLine
				renderLabel={renderLabel}
				blockNode
			/>
			<Modal
				title="添加权限"
				visible={showAdd}
				onOk={() => formApi.current?.submitForm?.()}
				onCancel={() => setShowAdd(false)}
				okText="添加"
				cancelText="取消"
				confirmLoading={loading === "add"}
			>
				<Form
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={handleAdd}
				>
					<Form.Input
						field="name"
						label="权限名称"
						rules={[RequiredRule]}
						placeholder="如：查询权限"
					/>
					<Form.Input
						field="permission"
						label="权限标识"
						rules={[RequiredRule]}
						placeholder="如：system:permission:query"
					/>
				</Form>
			</Modal>
			<Modal
				title="修改权限"
				visible={showEdit}
				onOk={() => formApi.current?.submitForm?.()}
				onCancel={() => {
					setShowEdit(false);
					setEditingNode(null);
				}}
				okText="修改"
				cancelText="取消"
				confirmLoading={loading === "edit"}
			>
				<Form
					key={editingNode?.permission ?? "edit"}
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={handleEdit}
					initValues={
						editingNode
							? { name: editingNode.name, permission: editingNode.permission }
							: undefined
					}
				>
					<Form.Input
						field="name"
						label="权限名称"
						rules={[RequiredRule]}
						placeholder="如：查询权限"
					/>
					<Form.Input
						field="permission"
						label="权限标识"
						disabled
						placeholder="不可修改"
					/>
				</Form>
			</Modal>
		</div>
	);
}
