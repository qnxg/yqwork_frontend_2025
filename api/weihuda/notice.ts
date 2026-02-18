"use server";

import { createServerAxios } from "@/lib/request";
import { IPageQueryData } from "../interface";

export interface INotice {
	/** id */
	id: number;
	/** 内容 */
	content: string;
	/** 收件人 */
	stuId: string;
	/** 发送时间 */
	sendTime: string;
	/** 是否完整显示在首页 */
	isShow: number | boolean;
	/** 状态 */
	status: number | boolean;
	/** 结果 */
	result: string;
	/** 关联类型 */
	bindType?: string;
	/** 关联的数据id */
	bindId?: number;
	/** 按钮配置 */
	btnConfig: string;
}

export interface INoticePageResponseData {
	count: number;
	rows: INotice[];
}

export interface INoticePageQueryData
	extends IPageQueryData, Partial<INotice> {}

/**
 * 获取消息通知列表分页
 */
export async function getNoticePageApi(queryData: INoticePageQueryData) {
	const r = await createServerAxios();
	const data: INoticePageResponseData = await r.get("/notice", {
		params: queryData,
	});
	return data;
}

/**
 * 新增消息通知
 */
export async function postNoticeApi(postData: Partial<INotice>) {
	const r = await createServerAxios();
	const data: INoticePageResponseData = await r.post("/notice", postData);
	return data;
}

/**
 * 编辑消息通知
 */
export async function putNoticeByIdApi(id: number, putData: Partial<INotice>) {
	const r = await createServerAxios();
	const data: INoticePageResponseData = await r.put(`/notice/${id}`, putData);
	return data;
}

/**
 * 删除消息通知
 */
export async function deleteNoticeByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/notice/${id}`);
}
