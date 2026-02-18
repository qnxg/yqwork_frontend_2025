import { getMiniMessagePageApi } from "@/api/weihuda/announcement";
import type { IPageQueryData } from "@/api/interface";
import { getUserWhoAmI } from "@/api/qnxg/user";
import AnnouncementIndex, {
	AnnouncementIndexPayload,
} from "./AnnouncementIndex";

export const dynamic = "force-dynamic";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const queryData: IPageQueryData = {
		page: params.page ? Number(params.page) : 1,
		pageSize: params.pageSize ? Number(params.pageSize) : 10,
	};

	const [whoami, pageData] = await Promise.all([
		getUserWhoAmI(),
		getMiniMessagePageApi(queryData),
	]);

	const payload: AnnouncementIndexPayload = {
		data: pageData,
		queryData,
		permissions: whoami.permissions.map((p) => p.permission),
	};

	return <AnnouncementIndex payload={payload} />;
}
