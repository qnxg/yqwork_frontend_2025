"use server";

import { createServerAxios } from "@/utils/request";

export interface IMiniConfig {
	/** key */
	key: string;
	/** value */
	value: string;
}

/**
 * 获取小程序配置列表
 */
export async function getMiniConfigApi() {
	const r = await createServerAxios();
	const data: IMiniConfig[] = await r.get("/mini-config");
	return data;
}

/**
 * 编辑小程序配置
 */
export async function putMiniConfigByIdApi(key: string, value: string) {
	const r = await createServerAxios();
	await r.put("/mini-config", {
		key,
		value,
	});
}
