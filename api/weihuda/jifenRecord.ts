"use server";

import { createServerAxios } from "@/utils/request";
import { IPageQueryData } from "../interface";

export interface IJifenRecord {
	/** id */
	id: number;
	/** key */
	key: string;
	/** 参数 */
	param: string;
	/** 学号 */
	stuId: string;
	/** 描述 */
	desc: string;
	/** 积分 */
	jifen: number;
	/** 创建时间 */
	createdAt: string;
}

export interface IJifenRecordPageResponseData {
	count: number;
	rows: IJifenRecord[];
}

export interface IJifenRecordPageQueryData
	extends
		IPageQueryData,
		Partial<Pick<IJifenRecord, "key" | "param" | "stuId">> {}

/**
 * 获取积分记录列表分页
 */
export async function getJifenRecordPageApi(
	queryData: IJifenRecordPageQueryData,
) {
	const r = await createServerAxios();
	const data: IJifenRecordPageResponseData = await r.get("/jifen-record", {
		params: queryData,
	});
	return data;
}

export type IJifenRecordPostData = Pick<
	IJifenRecord,
	"stuId" | "desc" | "jifen"
>;

/**
 * 新增积分记录
 */
export async function postJifenRecordApi(postData: IJifenRecordPostData) {
	const r = await createServerAxios();
	const data: IJifenRecord = await r.post("/jifen-record", postData);
	return data;
}

/** 根据 id 获取单条积分记录（后端无删除接口） */
export async function getJifenRecordByIdApi(id: number) {
	const r = await createServerAxios();
	const data: IJifenRecord = await r.get(`/jifen-record/${id}`);
	return data;
}

export interface IAddRecordBatchItem {
	stuId: string;
	delta: number;
	desc: string;
}

/**
 * 新增积分记录批量
 */
export async function postJifenRecordBatchApi(items: IAddRecordBatchItem[]) {
	const r = await createServerAxios();
	const data: void = await r.post("/jifen-record/batch", items);
	return data;
}
