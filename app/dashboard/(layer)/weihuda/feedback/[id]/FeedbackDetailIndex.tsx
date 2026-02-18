"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	Descriptions,
	Divider,
	Form,
	Select,
	Space,
	Tag,
	Timeline,
	Modal,
} from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { IconDelete, IconReplyStroked } from "@douyinfe/semi-icons";
import {
	IFeedback,
	IFeedbackMsg,
	putFeedbackByIdApi,
	postFeedbackMsgApi,
	deleteFeedbackMsgApi,
} from "@/api/weihuda/feedback";
import { FeedbackStatusOptions } from "@/config/fields";
import { hasPermission } from "@/utils";
import { withToast } from "@/utils/action";
import { RequiredRule } from "@/utils/form";

const PERMISSION_PREFIX = "hdwsh:feedback";

export interface FeedbackDetailPayload {
	feedback: IFeedback;
	messages: IFeedbackMsg[];
	permissions: string[];
}

function formatDateTime(str: string) {
	try {
		return new Date(str).toLocaleString("zh-CN");
	} catch {
		return str;
	}
}

export default function FeedbackDetailIndex({
	payload,
}: Readonly<{ payload: FeedbackDetailPayload }>) {
	const router = useRouter();
	const { feedback, messages, permissions } = payload;
	const [feedbackData, setFeedbackData] = useState(feedback);
	const [loading, setLoading] = useState("");
	const replyFormApi = useRef<FormApi>(null);

	const canEdit = hasPermission(permissions, `${PERMISSION_PREFIX}:edit`);
	const canDelete = hasPermission(permissions, `${PERMISSION_PREFIX}:delete`);

	const handleStatusChange = async (status: number) => {
		if (!canEdit) return;
		setLoading("status");
		try {
			const updated = await withToast(
				() => putFeedbackByIdApi(feedback.id, { status }),
				"状态已更新",
			);
			if (updated) setFeedbackData(updated);
		} catch {
		} finally {
			setLoading("");
		}
	};

	const handleAddReply = async () => {
		if (!canEdit || !replyFormApi.current) return;
		setLoading("reply");
		try {
			const msg: string = (await replyFormApi.current.validate()).reply;
			await withToast(
				() => postFeedbackMsgApi(feedback.id, { typ: "comment", msg }),
				"回复已添加",
			);
			replyFormApi.current.reset();
			router.refresh();
		} catch {
		} finally {
			setLoading("");
		}
	};

	const handleDeleteMsg = (msgId: number) => {
		if (!canDelete) return;
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该回复吗？",
			okText: "确认删除",
			cancelText: "取消",
			onOk: async () => {
				setLoading(`delete-${msgId}`);
				try {
					await withToast(
						() => deleteFeedbackMsgApi(feedback.id, msgId),
						"删除成功",
					);
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	const statusOption = FeedbackStatusOptions.find(
		(o) => o.value === feedbackData.status,
	);

	return (
		<div className="max-w-4xl">
			{/* 问题反馈主体 */}
			<Card
				title={
					<Space align="center">
						<span className="font-medium">问题反馈 #{feedbackData.id}</span>
						{canEdit ? (
							<Select
								size="small"
								value={feedbackData.status}
								optionList={FeedbackStatusOptions}
								onChange={(value) => {
									if (typeof value === "number") handleStatusChange(value);
								}}
								disabled={loading !== ""}
								style={{ width: 160 }}
							/>
						) : (
							<Tag color={statusOption?.color}>{statusOption?.label}</Tag>
						)}
					</Space>
				}
			>
				<Descriptions
					row
					data={[
						{ key: "学号", value: feedbackData.stuId || "未登录" },
						{ key: "联系方式", value: feedbackData.contact || "无" },
						{
							key: "反馈时间",
							value: formatDateTime(feedbackData.createdAt),
						},
						{
							key: "最后更新",
							value: formatDateTime(feedbackData.updatedAt),
						},
					]}
				/>
				<Divider className="my-4" />
				<div className="whitespace-pre-wrap text-[15px]">
					{feedbackData.desc}
				</div>
				{feedbackData.imgUrl && (
					<div className="mt-4">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={feedbackData.imgUrl}
							alt="反馈图片"
							className="max-w-full max-h-80 rounded border object-contain"
						/>
					</div>
				)}
			</Card>

			{/* 回复列表 */}
			<Card title={`回复 (${messages.length})`} className="mt-4">
				{messages.length > 0 ? (
					<Timeline mode="left">
						{messages.map((msg) => (
							<Timeline.Item
								key={msg.id}
								time={formatDateTime(msg.createdAt)}
								extra={
									<Space>
										<span className="text-gray-500">{msg.stuId}</span>
										{canDelete && (
											<Button
												size="small"
												theme="borderless"
												type="danger"
												icon={<IconDelete />}
												onClick={() => handleDeleteMsg(msg.id)}
												loading={loading === `delete-${msg.id}`}
												disabled={loading !== ""}
											>
												删除
											</Button>
										)}
									</Space>
								}
							>
								<div className="py-1">{msg.msg || "-"}</div>
							</Timeline.Item>
						))}
					</Timeline>
				) : (
					<div className="text-gray-400 py-8 text-center">暂无回复</div>
				)}

				{canEdit && (
					<>
						<Divider margin="16px 0" />
						<Form getFormApi={(api) => (replyFormApi.current = api)}>
							<Form.TextArea
								field="reply"
								label="添加回复"
								placeholder="填写回复内容..."
								rows={4}
								showClear
								rules={[RequiredRule]}
							/>
							<div className="flex">
								<Button
									icon={<IconReplyStroked />}
									type="primary"
									onClick={handleAddReply}
									loading={loading === "reply"}
									className="ml-auto"
								>
									添加
								</Button>
							</div>
						</Form>
					</>
				)}
			</Card>
		</div>
	);
}
