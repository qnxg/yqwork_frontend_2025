"use server";

import { createServerAxios } from "@/lib/request";
import { IPageQueryData } from "../interface";
import { IDepartment } from "./department";

export interface IWorkHours {
	id: number;
	name: string;
	endTime: string;
	status: number;
	comment?: string;
}

export interface IWorkHoursPageResponseData {
	count: number;
	rows: IWorkHours[];
}

export type IWorkHoursBasicInfo = Pick<
	IWorkHours,
	"name" | "endTime" | "status" | "comment"
>;

export async function getWorkHoursPageApi(queryData: IPageQueryData) {
	const r = await createServerAxios();
	const res: IWorkHoursPageResponseData = await r.get("/work-hours", {
		params: queryData,
	});
	return res;
}

export async function getWorkHoursByIdApi(id: number) {
	const r = await createServerAxios();
	const res: IWorkHours = await r.get(`/work-hours/${id}`);
	return res;
}

export async function postWorkHoursApi(postData: IWorkHoursBasicInfo) {
	const r = await createServerAxios();
	const res: IWorkHours = await r.post("/work-hours", postData);
	return res;
}

export async function putWorkHoursByIdApi(
	id: number,
	putData: IWorkHoursBasicInfo,
) {
	const r = await createServerAxios();
	await r.put(`/work-hours/${id}`, putData);
}

export async function deleteWorkHoursByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/work-hours/${id}`);
}

export interface IWorkHoursStatistics {
	department: IDepartment;
	stats: IWorkHoursStatisticsItem;
}

export interface IWorkHoursStatisticsItem {
	count: number;
	totalHours: number;
}

export async function getWorkHoursStatisticsApi(id: number) {
	const r = await createServerAxios();
	const res: IWorkHoursStatistics[] = await r.get("/work-hours/statistics", {
		params: { workHourId: id },
	});
	return res;
}
