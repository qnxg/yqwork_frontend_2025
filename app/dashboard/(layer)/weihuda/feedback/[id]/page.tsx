import {
	getFeedbackByIdApi,
	getFeedbackMsgApi,
	getFeedbackPageApi,
} from "@/api/weihuda/feedback";
import { getUserWhoAmI } from "@/api/qnxg/user";
import FeedbackDetailIndex, {
	FeedbackDetailPayload,
} from "./FeedbackDetailIndex";
import { NotFoundError } from "@/utils/result";

export const dynamic = "force-dynamic";
export const OTHER_RECENT_FEEDBACK_LIMIT = 3;

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const feedbackId = Number(id);
	if (Number.isNaN(feedbackId)) {
		throw new NotFoundError("问题反馈不存在");
	}

	const [whoami, feedback, messages] = await Promise.all([
		getUserWhoAmI(),
		getFeedbackByIdApi(feedbackId),
		getFeedbackMsgApi(feedbackId),
	]);

	if (!feedback) {
		throw new NotFoundError("问题反馈不存在");
	}

	const recentFeedbacks =
		feedback.stuId && feedback.stuId.trim()
			? (
					await getFeedbackPageApi({
						page: 1,
						pageSize: OTHER_RECENT_FEEDBACK_LIMIT + 1,
						stuId: feedback.stuId.trim(),
					})
				).rows
					.filter((f) => f.id !== feedback.id)
					.slice(0, OTHER_RECENT_FEEDBACK_LIMIT)
			: undefined;

	const payload: FeedbackDetailPayload = {
		feedback,
		messages,
		recentFeedbacks,
		permissions: whoami.permissions.map((p) => p.permission),
	};

	return <FeedbackDetailIndex payload={payload} />;
}
