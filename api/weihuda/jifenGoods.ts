"use server";

import { createServerAxios } from "@/lib/request";

export interface IJifenGoods {
	/** id */
	id: number;
	/** 名称 */
	name: string;
	/** 图片 */
	cover: string;
	/** 数量 */
	count: number;
	/** 价格 */
	price: number;
	/** 描述 */
	description?: string;
	/** 启用 */
	enabled: boolean;
}

export type IJifenGoodsBasicInfo = Pick<
	IJifenGoods,
	"name" | "cover" | "count" | "price" | "description" | "enabled"
>;

/**
 * 获取积分奖品列表分页
 */
export async function getJifenGoodsApi() {
	const r = await createServerAxios();
	const data: IJifenGoods[] = await r.get("/jifen-goods");
	return data;
}

/**
 * 新增积分奖品
 */
export async function postJifenGoodsApi(postData: IJifenGoodsBasicInfo) {
	const r = await createServerAxios();
	const data: IJifenGoods = await r.post("/jifen-goods", postData);
	return data;
}

/**
 * 编辑积分奖品
 */
export async function putJifenGoodsByIdApi(
	id: number,
	putData: IJifenGoodsBasicInfo,
) {
	const r = await createServerAxios();
	const data: IJifenGoods = await r.put(`/jifen-goods/${id}`, putData);
	return data;
}

/**
 * 删除积分奖品
 */
export async function deleteJifenGoodsByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/jifen-goods/${id}`);
}
