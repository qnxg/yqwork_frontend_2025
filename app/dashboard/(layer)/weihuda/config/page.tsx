import { getMiniConfigApi } from "@/api/weihuda/miniConfig";
import { getUserWhoAmI } from "@/api/qnxg/user";
import ConfigIndex, { ConfigIndexPayload } from "./ConfigIndex";
import { TAB_KEYS, type ConfigTabKey } from "./config";

export const dynamic = "force-dynamic";
export type { ConfigTabKey } from "./config";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const tabParam = params.tab as string | undefined;
	const tab: ConfigTabKey = TAB_KEYS.includes(tabParam as ConfigTabKey)
		? (tabParam as ConfigTabKey)
		: "term";

	const [whoami, configList] = await Promise.all([
		getUserWhoAmI(),
		getMiniConfigApi(),
	]);

	const payload: ConfigIndexPayload = {
		configList,
		tab,
		permissions: whoami.permissions.map((p) => p.permission),
	};

	return <ConfigIndex payload={payload} />;
}
