"use client";

import {
	Button,
	Col,
	Form,
	Modal,
	Row,
	Space,
	Table,
	Toast,
	Upload,
} from "@douyinfe/semi-ui-19";
import { IconDelete, IconEdit, IconPlus } from "@douyinfe/semi-icons";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	deleteJifenGoodsByIdApi,
	postJifenGoodsApi,
	putJifenGoodsByIdApi,
	type IJifenGoods,
	type IJifenGoodsBasicInfo,
} from "@/api/weihuda/jifenGoods";
import { postUploadImgApi } from "@/api/upload";
import { getProxyUrl } from "@/utils";
import { hasPermission } from "@/utils";
import { withToast } from "@/utils/action";
import { RequiredRule } from "@/utils/form";

export interface JifenGoodsIndexProps {
	initialGoods: IJifenGoods[];
	permissions: string[];
}

const ENABLED_OPTIONS = [
	{ label: "启用", value: 1 },
	{ label: "禁用", value: 0 },
];

const PERMISSION_PREFIX = "hdwsh:jifenGoods";

export default function JifenGoodsIndex({
	initialGoods,
	permissions,
}: JifenGoodsIndexProps) {
	const router = useRouter();
	const [goods, setGoods] = useState(initialGoods);

	useEffect(() => {
		setGoods(initialGoods);
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [initialGoods]);

	const [loading, setLoading] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<IJifenGoods | null>(null);
	const formApiRef = useRef<FormApi | null>(null);
	const [coverUrl, setCoverUrl] = useState("");

	const { canAdd, canEdit, canDelete } = useMemo(() => {
		return {
			canAdd: hasPermission(permissions, `${PERMISSION_PREFIX}:add`),
			canEdit: hasPermission(permissions, `${PERMISSION_PREFIX}:edit`),
			canDelete: hasPermission(permissions, `${PERMISSION_PREFIX}:delete`),
		};
	}, [permissions]);

	const handleOpenModal = (item: IJifenGoods | null) => {
		setEditing(item);
		setCoverUrl(item?.cover ?? "");
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
		setEditing(null);
		setCoverUrl("");
		formApiRef.current?.reset();
	};

	const handleSubmit = async () => {
		if (!formApiRef.current) return;
		setLoading("submit");
		try {
			const values = await formApiRef.current.validate();
			const count = Number(values.count);
			if (!Number.isInteger(count) || count <= 0) {
				Toast.error("剩余数量必须是正整数");
				throw new Error();
			}
			if (!coverUrl || coverUrl.trim().length === 0) {
				Toast.error("请上传图片");
				throw new Error();
			}
			const data: IJifenGoodsBasicInfo = {
				name: values.name,
				cover: coverUrl,
				count,
				price: Number(values.price),
				description: values.description?.trim() || undefined,
				enabled: values.enabled === 1,
			};
			if (editing) {
				await withToast(
					() => putJifenGoodsByIdApi(editing.id, data),
					"修改成功",
				);
			} else {
				await withToast(() => postJifenGoodsApi(data), "添加成功");
			}
			handleCloseModal();
			router.refresh();
		} catch {}
		setLoading("");
	};

	const handleDelete = (id: number) => {
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该积分奖品吗？",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${id}`);
				try {
					await withToast(() => deleteJifenGoodsByIdApi(id), "删除成功");
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
		{ title: "序号", dataIndex: "id", key: "id", width: 80 },
		{ title: "名称", dataIndex: "name", key: "name", width: 120 },
		{
			title: "图片",
			dataIndex: "cover",
			key: "cover",
			width: 80,
			render: (url: string) =>
				url ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={getProxyUrl(url)}
						alt=""
						className="w-12 h-12 object-cover rounded"
					/>
				) : (
					"-"
				),
		},
		{ title: "剩余数量", dataIndex: "count", key: "count", width: 100 },
		{ title: "所需积分", dataIndex: "price", key: "price", width: 100 },
		{
			title: "描述",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
			render: (v: string) => v || "-",
			width: 200,
		},
		{
			title: "启用状态",
			dataIndex: "enabled",
			key: "enabled",
			width: 100,
			render: (v: boolean) => (v ? "启用" : "禁用"),
		},
		{
			title: "操作",
			key: "action",
			width: 160,
			fixed: "right" as const,
			render: (_: unknown, record: IJifenGoods) => (
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
				dataSource={goods}
				rowKey="id"
				pagination={false}
				empty={<div>暂无积分奖品</div>}
			/>

			<Modal
				title={editing ? "编辑" : "新增"}
				visible={modalOpen}
				onCancel={handleCloseModal}
				onOk={handleSubmit}
				okText={editing ? "修改" : "添加"}
				cancelText="取消"
				confirmLoading={loading === "submit"}
				width={600}
			>
				<Form
					getFormApi={(api) => (formApiRef.current = api)}
					labelPosition="top"
					initValues={
						editing
							? {
									name: editing.name,
									count: editing.count,
									price: editing.price,
									description: editing.description,
									enabled: editing.enabled ? 1 : 0,
								}
							: { enabled: 1 }
					}
				>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Input
								field="name"
								label="名称"
								placeholder="请输入奖品名称"
								rules={[RequiredRule]}
							/>
						</Col>
						<Col span={12}>
							<Form.Slot label={{ text: "图片", required: true }}>
								<Upload
									fileName="coverFile"
									action="#"
									accept="image/*"
									listType="picture"
									limit={1}
									fileList={
										coverUrl.trim().length > 0
											? [
													{
														uid: "cover-1",
														name: "封面",
														size: "0",
														status: "success" as const,
														url: getProxyUrl(coverUrl),
													},
												]
											: []
									}
									onChange={({ fileList }) => {
										const url = fileList[0]?.url ?? "";
										setCoverUrl(url);
									}}
									customRequest={({ fileInstance, onError, onSuccess }) => {
										if (!fileInstance) {
											onError?.({ status: 0 });
											return;
										}
										postUploadImgApi(fileInstance, "jifen-goods")
											.then((res) => {
												setCoverUrl(res.url);
												onSuccess?.({ url: res.url });
											})
											.catch(() => onError?.({ status: 500 }));
									}}
									onRemove={() => setCoverUrl("")}
								>
									<IconPlus size="extra-large" />
								</Upload>
								<div className="text-xs text-[var(--semi-color-text-2)] mt-1">
									必选，请上传奖品图片
								</div>
							</Form.Slot>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Input
								field="count"
								label="剩余数量"
								placeholder="请输入剩余数量"
								type="number"
								rules={[RequiredRule]}
								min={0}
							/>
						</Col>
						<Col span={12}>
							<Form.Input
								field="price"
								label="所需积分"
								placeholder="请输入所需积分"
								type="number"
								rules={[RequiredRule]}
							/>
						</Col>
					</Row>
					<Form.TextArea
						field="description"
						label="描述"
						placeholder="可选"
						rows={3}
					/>
					<Form.Select
						field="enabled"
						label="启用状态"
						optionList={ENABLED_OPTIONS}
						rules={[RequiredRule]}
					/>
				</Form>
			</Modal>
		</div>
	);
}
