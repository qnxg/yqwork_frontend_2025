"use server";

import { createServerAxios } from "@/utils/request";
import { IPageQueryData } from "../interface";

export interface INotice {
	/** id */
	id: number;
	/** 内容 */
	content: string;
	/** 收件人 */
	stuId: string;
	/** 是否完整显示在首页 */
	isShow: boolean;
	/** 状态 */
	status: number;
	/** 跳转链接 */
	url?: string;
	/** 发送时间 */
	createdAt: string;
}

export interface INoticePageResponseData {
	count: number;
	rows: INotice[];
}

export interface INoticePageQueryData
	extends IPageQueryData, Partial<Pick<INotice, "stuId" | "status">> {
	from?: string;
	to?: string;
}

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

export async function getNoticeApi(id: number) {
	const r = await createServerAxios();
	const data: INotice = await r.get(`/notice/${id}`);
	return data;
}

type INoticePostData = Pick<INotice, "stuId" | "content" | "isShow" | "url">;

/**
 * 新增消息通知
 */
export async function postNoticeApi(postData: INoticePostData) {
	const r = await createServerAxios();
	const data: INoticePageResponseData = await r.post("/notice", postData);
	return data;
}

/**
 * 删除消息通知
 */
export async function deleteNoticeByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/notice/${id}`);
}
