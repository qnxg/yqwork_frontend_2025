import { getFeedbackPageApi } from "@/api/weihuda/feedback";
import type { IFeedbackPageQueryData } from "@/api/weihuda/feedback";
import { getUserWhoAmI } from "@/api/qnxg/user";
import FeedbackIndex, { FeedbackIndexPayload } from "./FeedbackIndex";

export const dynamic = "force-dynamic";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const queryData: IFeedbackPageQueryData = {
		page: params.page ? Number(params.page) : 1,
		pageSize: params.pageSize ? Number(params.pageSize) : 10,
		stuId: params.stuId as string | undefined,
		status: params.status ? Number(params.status) : undefined,
		from: params.from as string | undefined,
		to: params.to as string | undefined,
	};

	const [whoami, pageData] = await Promise.all([
		getUserWhoAmI(),
		getFeedbackPageApi(queryData),
	]);

	const payload: FeedbackIndexPayload = {
		data: pageData,
		queryData,
		permissions: whoami.permissions.map((p) => p.permission),
	};

	return <FeedbackIndex payload={payload} />;
}
