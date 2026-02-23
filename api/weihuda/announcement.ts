"use server";

import { createServerAxios } from "@/utils/request";
import { IPageQueryData } from "../interface";

export interface IAnnouncement {
	/** id */
	id: number;
	/** 标题 */
	title: string;
	/** 内容 */
	content: string;
	/** 跳转连接 */
	url?: string;
	/** 删除时间，为空说明没删除 */
	deletedAt?: string;
}

export type IAnnouncementBasicInfo = Pick<
	IAnnouncement,
	"title" | "content" | "url"
>;

export interface IAnnouncementPageResponseData {
	count: number;
	rows: IAnnouncement[];
}

/**
 * 获取微生活公告列表分页
 */
export async function getMiniMessagePageApi(queryData: IPageQueryData) {
	const r = await createServerAxios();
	const data: IAnnouncementPageResponseData = await r.get("/announcement", {
		params: queryData,
	});
	return data;
}

/**
 * 新增微生活公告
 */
export async function postMiniMessageApi(postData: IAnnouncementBasicInfo) {
	const r = await createServerAxios();
	const data: IAnnouncementBasicInfo = await r.post("/announcement", postData);
	return data;
}

/**
 * 编辑微生活公告
 */
export async function putMiniMessageByIdApi(
	id: number,
	putData: IAnnouncementBasicInfo,
) {
	const r = await createServerAxios();
	const data: IAnnouncementBasicInfo = await r.put(
		`/announcement/${id}`,
		putData,
	);
	return data;
}

/**
 * 删除微生活公告
 */
export async function deleteMiniMessageByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/announcement/${id}`);
}
