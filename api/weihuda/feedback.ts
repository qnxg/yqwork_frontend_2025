"use server";

import { createServerAxios } from "@/utils/request";
import { IPageQueryData } from "../interface";

export interface IFeedback {
	/** id */
	id: number;
	/** 联系方式 */
	contact?: string;
	/** 问题描述 */
	desc: string;
	/** 图片 */
	imgUrl?: string;
	/** 学号 */
	stuId?: string;
	/** 反馈时间 */
	createdAt: string;
	/** 最后更新时间 */
	updatedAt: string;
	/** 状态 */
	status: number;
}

export interface IFeedbackPageResponseData {
	count: number;
	rows: IFeedback[];
}

export type IFeedbackPageQueryData = IPageQueryData &
	Partial<Pick<IFeedback, "stuId" | "status">> & {
		from?: string;
		to?: string;
	};

/**
 * 根据 id 获取问题反馈详情
 */
export async function getFeedbackByIdApi(id: number) {
	const r = await createServerAxios();
	const data: IFeedback | null = await r.get(`/feedback/${id}`);
	return data;
}

/**
 * 获取问题反馈列表分页
 */
export async function getFeedbackPageApi(queryData: IFeedbackPageQueryData) {
	const r = await createServerAxios();
	const data: IFeedbackPageResponseData = await r.get("/feedback", {
		params: queryData,
	});
	return data;
}

export interface IFeedbackPutData {
	status: IFeedback["status"];
}

/**
 * 编辑问题反馈
 */
export async function putFeedbackByIdApi(
	id: number,
	putData: IFeedbackPutData,
) {
	const r = await createServerAxios();
	const data: IFeedback = await r.put(`/feedback/${id}`, putData);
	return data;
}

/**
 * 删除问题反馈
 */
export async function deleteFeedbackByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/feedback/${id}`);
}

export interface IFeedbackMsg {
	/** id */
	id: number;
	/** 类型 */
	typ: string;
	/** 消息 */
	msg?: string;
	/** 学号 */
	stuId: string;
	/** 反馈id */
	feedbackId: number;
	/** 创建时间 */
	createdAt: string;
}

export async function getFeedbackMsgApi(feedbackId: number) {
	const r = await createServerAxios();
	const data: IFeedbackMsg[] = await r.get(`/feedback/${feedbackId}/msg`);
	return data;
}

export type IFeedbackMsgPostData = Pick<IFeedbackMsg, "typ" | "msg">;

export async function postFeedbackMsgApi(
	feedbackId: number,
	postData: IFeedbackMsgPostData,
) {
	const r = await createServerAxios();
	const data: number = await r.post(`/feedback/${feedbackId}/msg`, postData);
	return data;
}

export async function deleteFeedbackMsgApi(feedbackId: number, msgId: number) {
	const r = await createServerAxios();
	await r.delete(`/feedback/${feedbackId}/msg/${msgId}`);
}
