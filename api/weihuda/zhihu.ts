"use server";

import { createServerAxios } from "@/lib/request";
import { IPageQueryData } from "../interface";

export interface IZhihuBasicInfo {
	/** 标题 */
	title: string;
	/** 类型 */
	typ: string;
	/** 内容 */
	content: string;
	/** 标签 */
	tags: string;
	/** 封面 */
	cover?: string;
	/** 状态 */
	status: number;
	/** 学号 */
	stuId: string;
	/** 是否置顶 */
	top: boolean;
	/** 创建时间 */
	createdAt: string;
}

export interface IZhihu {
	/** id */
	id: number;
	info: IZhihuBasicInfo;
}

export interface IZhihuPageResponseData {
	count: number;
	rows: IZhihu[];
}

export interface IZhihuPageQueryData
	extends
		IPageQueryData,
		Partial<Pick<IZhihuBasicInfo, "title" | "tags" | "status" | "stuId">> {}

/**
 * 获取知湖文章列表分页
 */
export async function getZhihuPageApi(queryData: IZhihuPageQueryData) {
	const r = await createServerAxios();
	const data: IZhihuPageResponseData = await r.get("/zhihu", {
		params: queryData,
	});
	return data;
}

export interface IWxUrlResolveResponseData {
	title: string;
	cover: string;
}

/**
 * 从微生活公众号文章分享链接中导入（解析文章信息并返回）
 * @param url 分享链接
 */
export async function getZhihuUrlResolveApi(url: string) {
	const r = await createServerAxios();
	const data: IWxUrlResolveResponseData = await r.get("/zhihu/url-resolve", {
		params: { url },
	});
	return data;
}

/**
 * 根据 id 获取知湖文章
 */
export async function getZhihuByIdApi(id: number) {
	const r = await createServerAxios();
	const data: IZhihu = await r.get(`/zhihu/${id}`);
	return data;
}

export type IZhihuPostData = Pick<
	IZhihuBasicInfo,
	"typ" | "title" | "content" | "tags" | "cover" | "status" | "top"
>;

/**
 * 新增知湖文章
 */
export async function postZhihuApi(postData: IZhihuPostData) {
	const r = await createServerAxios();
	const data: IZhihu = await r.post("/zhihu", postData);
	return data;
}

export type IZhihuPutData = Pick<
	IZhihuBasicInfo,
	"title" | "content" | "tags" | "cover" | "status" | "top"
>;

/**
 * 编辑知湖文章
 */
export async function putZhihuByIdApi(id: number, putData: IZhihuPutData) {
	const r = await createServerAxios();
	const data: IZhihu = await r.put(`/zhihu/${id}`, putData);
	return data;
}

/**
 * 删除知湖文章
 */
export async function deleteZhihuByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/zhihu/${id}`);
}
