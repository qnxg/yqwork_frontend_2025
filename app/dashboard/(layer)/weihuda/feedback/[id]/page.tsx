import { getFeedbackByIdApi, getFeedbackMsgApi } from "@/api/weihuda/feedback";
import { getUserWhoAmI } from "@/api/qnxg/user";
import FeedbackDetailIndex, {
	FeedbackDetailPayload,
} from "./FeedbackDetailIndex";
import { NotFoundError } from "@/utils/result";

export const dynamic = "force-dynamic";

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

	const payload: FeedbackDetailPayload = {
		feedback,
		messages,
		permissions: whoami.permissions.map((p) => p.permission),
	};

	return <FeedbackDetailIndex payload={payload} />;
}
