"use client";

import { Button, Form, Modal, Space, Table } from "@douyinfe/semi-ui-19";
import { IconDelete, IconEdit, IconPlus } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	deleteJifenRuleByIdApi,
	postJifenRuleApi,
	putJifenRuleByIdApi,
	type IJifenRule,
	type IJifenRuleBasicInfo,
} from "@/api/weihuda/jifenRule";
import { hasPermission } from "@/utils";
import { withToast } from "@/utils/action";
import { RequiredRule } from "@/utils/form";

export interface JifenRuleIndexProps {
	initialRules: { count: number; rows: IJifenRule[] };
	permissions: string[];
}

const IS_SHOW_OPTIONS = [
	{ label: "是", value: 1 },
	{ label: "否", value: 0 },
];

const PERMISSION_PREFIX = "hdwsh:jifenRule";

export default function JifenRuleIndex({
	initialRules,
	permissions,
}: JifenRuleIndexProps) {
	const router = useRouter();
	const { rows: rules } = initialRules;
	const [loading, setLoading] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<IJifenRule | null>(null);
	const formApiRef = useRef<FormApi | null>(null);

	const { canAdd, canEdit, canDelete } = useMemo(() => {
		return {
			canAdd: hasPermission(permissions, `${PERMISSION_PREFIX}:add`),
			canEdit: hasPermission(permissions, `${PERMISSION_PREFIX}:edit`),
			canDelete: hasPermission(permissions, `${PERMISSION_PREFIX}:delete`),
		};
	}, [permissions]);

	const handleOpenModal = (item: IJifenRule | null) => {
		setEditing(item);
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
		setEditing(null);
		formApiRef.current?.reset();
	};

	const handleSubmit = async () => {
		if (!formApiRef.current) return;
		setLoading("submit");
		try {
			const values = await formApiRef.current.validate();
			const data: IJifenRuleBasicInfo = {
				key: values.key,
				name: values.name,
				jifen: Number(values.jifen),
				cycle: Number(values.cycle),
				maxCount: Number(values.maxCount),
				isShow: values.isShow === 1,
			};
			if (editing) {
				await withToast(
					() => putJifenRuleByIdApi(editing.id, data),
					"修改成功",
				);
			} else {
				await withToast(() => postJifenRuleApi(data), "添加成功");
			}
			handleCloseModal();
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleDelete = (id: number) => {
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该积分规则吗？",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteJifenRuleByIdApi(id), "删除成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	const columns = [
		{ title: "序号", dataIndex: "id", key: "id", width: 50 },
		{ title: "key", dataIndex: "key", key: "key", width: 120 },
		{ title: "名称", dataIndex: "name", key: "name", width: 120 },
		{ title: "积分", dataIndex: "jifen", key: "jifen", width: 80 },
		{ title: "周期（天）", dataIndex: "cycle", key: "cycle", width: 100 },
		{ title: "上限", dataIndex: "maxCount", key: "maxCount", width: 80 },
		{
			title: "是否显示",
			dataIndex: "isShow",
			key: "isShow",
			width: 100,
			render: (v: boolean) => (v ? "是" : "否"),
		},
		{
			title: "操作",
			key: "action",
			width: 160,
			fixed: "right" as const,
			render: (_: unknown, record: IJifenRule) => (
				<Space>
					{canEdit && (
						<Button
							theme="light"
							type="primary"
							icon={<IconEdit />}
							onClick={() => handleOpenModal(record)}
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
			{canAdd && (
				<Button
					theme="solid"
					type="warning"
					className="mb-4"
					icon={<IconPlus />}
					onClick={() => handleOpenModal(null)}
				>
					新增
				</Button>
			)}
			<Table
				columns={columns}
				dataSource={rules}
				rowKey="id"
				pagination={false}
				empty={<div>暂无积分规则</div>}
			/>

			<Modal
				title={editing ? "编辑积分规则" : "新增积分规则"}
				visible={modalOpen}
				onCancel={handleCloseModal}
				onOk={handleSubmit}
				okText={editing ? "修改" : "添加"}
				cancelText="取消"
				confirmLoading={loading === "submit"}
			>
				<Form
					getFormApi={(api) => (formApiRef.current = api)}
					labelPosition="top"
					initValues={
						editing
							? {
									key: editing.key,
									name: editing.name,
									jifen: editing.jifen,
									cycle: editing.cycle,
									maxCount: editing.maxCount,
									isShow: editing.isShow ? 1 : 0,
								}
							: { isShow: 1 }
					}
				>
					<Form.Input
						field="key"
						label="key"
						placeholder="请输入 key"
						rules={[RequiredRule]}
					/>
					<Form.Input
						field="name"
						label="名称"
						placeholder="请输入名称"
						rules={[RequiredRule]}
					/>
					<Form.Input
						field="jifen"
						label="积分"
						placeholder="请输入积分"
						type="number"
						rules={[RequiredRule]}
					/>
					<Form.Input
						field="cycle"
						label="周期（天）"
						placeholder="请输入周期天数"
						type="number"
						rules={[RequiredRule]}
					/>
					<Form.Input
						field="maxCount"
						label="奖励次数上限"
						placeholder="请输入上限"
						type="number"
						rules={[RequiredRule]}
					/>
					<Form.Select
						field="isShow"
						label="是否显示"
						optionList={IS_SHOW_OPTIONS}
						rules={[RequiredRule]}
					/>
				</Form>
			</Modal>
		</div>
	);
}
