"use server";

import { createServerAxios } from "@/utils/request";
import { IPageQueryData } from "../interface";

export interface IGoodsRecord {
	/** id */
	id: number;
	/** 学号 */
	stuId: string;
	/** 奖品id */
	goodsId: number;
	/** 状态 */
	status: number;
	/** 收货时间 */
	receiveTime?: string;
	/** 兑换时间 */
	createdAt: string;
}

export interface IGoodsRecordPageResponseData {
	count: number;
	rows: IGoodsRecord[];
}

export interface IGoodsRecordPageQueryData
	extends
		IPageQueryData,
		Partial<Pick<IGoodsRecord, "stuId" | "goodsId" | "status">> {}

/**
 * 获取兑换记录列表分页
 */
export async function getGoodsRecordPageApi(
	queryData: IGoodsRecordPageQueryData,
) {
	const r = await createServerAxios();
	const data: IGoodsRecordPageResponseData = await r.get("/goods-record", {
		params: queryData,
	});
	return data;
}

export async function getGoodsReceiveApi(id: number) {
	const r = await createServerAxios();
	await r.get(`/goods-record/${id}/receive`);
}

/**
 * 删除兑换记录
 */
export async function deleteGoodsRecordByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/goods-record/${id}`);
}
