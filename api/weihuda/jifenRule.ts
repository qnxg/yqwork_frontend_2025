"use server";

import { createServerAxios } from "@/lib/request";

export interface IJifenRule {
	/** id */
	id: number;
	/** key */
	key: string;
	/** 名称 */
	name: string;
	/** 积分 */
	jifen: number;
	/** 周期（天） */
	cycle: number;
	/** 奖励次数上限 */
	maxCount: number;
	/** 是否显示在小程序中 */
	isShow: boolean;
}

export type IJifenRuleBasicInfo = Pick<
	IJifenRule,
	"key" | "name" | "jifen" | "cycle" | "maxCount" | "isShow"
>;

export interface IJifenRulePageResponseData {
	count: number;
	rows: IJifenRule[];
}

/**
 * 获取积分规则列表
 */
export async function getJifenRuleApi() {
	const r = await createServerAxios();
	const data: IJifenRulePageResponseData = await r.get("/jifen-rule");
	return data;
}

/**
 * 新增积分规则
 */
export async function postJifenRuleApi(postData: IJifenRuleBasicInfo) {
	const r = await createServerAxios();
	const data: IJifenRule = await r.post("/jifen-rule", postData);
	return data;
}

/**
 * 编辑积分规则
 */
export async function putJifenRuleByIdApi(
	id: number,
	putData: IJifenRuleBasicInfo,
) {
	const r = await createServerAxios();
	const data: IJifenRule = await r.put(`/jifen-rule/${id}`, putData);
	return data;
}

/**
 * 删除积分规则
 */
export async function deleteJifenRuleByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/jifen-rule/${id}`);
}
