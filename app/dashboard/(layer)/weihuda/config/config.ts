import type { IMiniConfig } from "@/api/weihuda/miniConfig";

export const TAB_KEYS = ["term", "zhihu", "jifen", "faq", "changelog"] as const;
export type ConfigTabKey = (typeof TAB_KEYS)[number];

export interface ConfigIndexPayload {
	configList: IMiniConfig[];
	tab: ConfigTabKey;
	permissions: string[];
}

export function getConfigValue(configList: IMiniConfig[], key: string): string {
	return configList.find((c) => c.key === key)?.value ?? "";
}
