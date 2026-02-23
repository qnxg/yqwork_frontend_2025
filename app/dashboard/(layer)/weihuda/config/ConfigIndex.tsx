"use client";

import { Tabs } from "@douyinfe/semi-ui-19";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
	getConfigValue,
	TAB_KEYS,
	type ConfigIndexPayload,
	type ConfigTabKey,
} from "./config";
import {
	CHANGELOG_CONFIG_KEY,
	CLASS_START_DATE_TABLE_CONFIG_KEY,
	FAQ_CONFIG_KEY,
	FLEX_TIME_CONFIG_KEY,
	JIFEN_DESC_CONFIG_KEY,
	NEXT_VACATION_DATE_CONFIG_KEY,
	ZHIHU_TAGS_CONFIG_KEY,
} from "@/config";
import { hasPermission } from "@/utils";
import {
	ChangelogConfigTab,
	FaqConfigTab,
	JifenConfigTab,
	TermConfigTab,
	ZhihuConfigTab,
} from "./tabs";
import { useRefreshOnSearchParamsChange } from "@/utils/hooks";
import { useMemo } from "react";

const PERMISSION_PREFIX = "hdwsh:miniConfig";

export type { ConfigIndexPayload } from "./config";

export default function ConfigIndex({
	payload,
}: Readonly<{ payload: ConfigIndexPayload }>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { configList, tab, permissions } = payload;

	const { canEdit } = useMemo(() => {
		return {
			canEdit: hasPermission(permissions, `${PERMISSION_PREFIX}:edit`),
		};
	}, [permissions]);

	const tabFromUrl = searchParams.get("tab");
	const activeKey: ConfigTabKey = TAB_KEYS.includes(tabFromUrl as ConfigTabKey)
		? (tabFromUrl as ConfigTabKey)
		: tab;

	const updateTab = (key: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set("tab", key);
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	useRefreshOnSearchParamsChange(searchParams);

	const nextVacationDateStr = getConfigValue(
		configList,
		NEXT_VACATION_DATE_CONFIG_KEY,
	);
	const classStartTableStr = getConfigValue(
		configList,
		CLASS_START_DATE_TABLE_CONFIG_KEY,
	);
	const flexTimeStr = getConfigValue(configList, FLEX_TIME_CONFIG_KEY);
	const zhihuTagsStr = getConfigValue(configList, ZHIHU_TAGS_CONFIG_KEY);
	const jifenDesc = getConfigValue(configList, JIFEN_DESC_CONFIG_KEY);
	const faqStr = getConfigValue(configList, FAQ_CONFIG_KEY);
	const changelogStr = getConfigValue(configList, CHANGELOG_CONFIG_KEY);

	return (
		<div>
			<Tabs
				type="line"
				activeKey={activeKey}
				onChange={(key) => updateTab(key)}
				keepDOM={false}
				className="mx-2"
			>
				<Tabs.TabPane tab="学期" itemKey="term">
					<TermConfigTab
						nextVacationDateStr={nextVacationDateStr}
						classStartDateTableStr={classStartTableStr}
						flexTimeStr={flexTimeStr}
						canEdit={canEdit}
					/>
				</Tabs.TabPane>
				<Tabs.TabPane tab="知湖" itemKey="zhihu">
					<ZhihuConfigTab zhihuTagsStr={zhihuTagsStr} canEdit={canEdit} />
				</Tabs.TabPane>
				<Tabs.TabPane tab="积分" itemKey="jifen">
					<JifenConfigTab jifenDesc={jifenDesc} canEdit={canEdit} />
				</Tabs.TabPane>
				<Tabs.TabPane tab="常见问题" itemKey="faq">
					<FaqConfigTab faqStr={faqStr} canEdit={canEdit} />
				</Tabs.TabPane>
				<Tabs.TabPane tab="更新日志" itemKey="changelog">
					<ChangelogConfigTab changelogStr={changelogStr} canEdit={canEdit} />
				</Tabs.TabPane>
			</Tabs>
		</div>
	);
}
