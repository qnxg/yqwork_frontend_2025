import { getMiniConfigApi } from "@/api/weihuda/miniConfig";
import {
	getZhihuPageApi,
	type IZhihuPageQueryData,
	type IZhihuPageResponseData,
} from "@/api/weihuda/zhihu";
import { getUserWhoAmI } from "@/api/qnxg/user";
import { ZHIHU_TAGS_CONFIG_KEY } from "@/config";
import { getConfigValue } from "../config/config";
import ZhihuIndex, { ZhihuIndexPayload } from "./ZhihuIndex";

export const dynamic = "force-dynamic";

function parseZhihuTags(value: string): string[] {
	try {
		const arr = JSON.parse(value || "[]") as {
			label: string;
			value: string;
		}[];
		return arr.map((item) => item.label || item.value);
	} catch {
		return [];
	}
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const queryData: IZhihuPageQueryData = {
		page: params.page ? Number(params.page) : 1,
		pageSize: params.pageSize ? Number(params.pageSize) : 10,
		title: (params.title as string) || undefined,
		tags: (params.tags as string) || undefined,
		status: params.status !== undefined ? Number(params.status) : undefined,
		stuId: (params.stuId as string) || undefined,
	};

	const [whoami, pageData, configList] = await Promise.all([
		getUserWhoAmI(),
		getZhihuPageApi(queryData),
		getMiniConfigApi(),
	]);

	const zhihuTagsStr = getConfigValue(configList, ZHIHU_TAGS_CONFIG_KEY);
	const zhihuTags = parseZhihuTags(zhihuTagsStr);

	const payload: ZhihuIndexPayload = {
		data: pageData as IZhihuPageResponseData,
		queryData,
		permissions: whoami.permissions.map((p) => p.permission),
		zhihuTags,
	};

	return <ZhihuIndex payload={payload} />;
}
