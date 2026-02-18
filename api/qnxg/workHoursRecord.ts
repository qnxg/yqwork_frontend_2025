"use server";

import { createServerAxios } from "@/lib/request";
import { IUser } from "./user";

// 包含项
export interface IWorkHoursIncludeItem {
	id: number; // 包含id为id的记录的
	hour: number; // hour个工时
	// 这里可选是为了方便制作工资表的组件搞
	user?: IUser;
}

// 工作描述项
export interface IWorkDescItem {
	// 描述
	desc: string;
	// 工时
	hour: number;
}

export interface IWorkHoursRecord {
	/** id */
	id: number;
	/** 工时id */
	workHourId: number;
	/** 用户id */
	userId: number;
	/** 状态 */
	status: number;
	/** 工作描述 */
	workDescs: IWorkDescItem[];
	/** 包含项 */
	includes?: IWorkHoursIncludeItem[];
	/** 备注 */
	comment?: string;
	userInfo: IUser;
}

export async function getWorkHoursRecordPageApi(workHourId: number) {
	const r = await createServerAxios();
	const res: IWorkHoursRecord[] = await r.get("/work-hours-record", {
		params: { workHourId },
	});
	return res;
}

export async function getDepartmentWorkHoursRecordApi(workHourId: number) {
	const r = await createServerAxios();
	const res: IWorkHoursRecord[] = await r.get("/work-hours-record/department", {
		params: { workHourId },
	});
	return res;
}

export async function getMyWorkHoursRecordApi(workHourId: number) {
	const r = await createServerAxios();
	const res: IWorkHoursRecord | null = await r.get("/work-hours-record/my", {
		params: { workHourId },
	});
	return res;
}

export type IWorkHoursRecordPutData = Pick<
	IWorkHoursRecord,
	"status" | "workHourId" | "userId" | "comment"
>;

export async function putWorkHoursRecordByIdApi(
	putData: IWorkHoursRecordPutData,
) {
	const r = await createServerAxios();
	const res: IWorkHoursRecord = await r.put(`/work-hours-record`, putData);
	return res;
}

export async function putMyWorkHoursRecordApi(
	workHourId: number,
	workDescs: IWorkDescItem[],
) {
	const r = await createServerAxios();
	const res: IWorkHoursRecord = await r.put(`/work-hours-record/my`, {
		workHourId,
		workDescs,
	});
	return res;
}

export interface IWorkHoursTableItem {
	id: number;
	includes: IWorkHoursIncludeItem[];
}

export interface IWorkHoursRecordSaveData {
	data: IWorkHoursTableItem[];
}

export async function putWorkHoursRecordSaveApi(
	data: IWorkHoursRecordSaveData,
) {
	const r = await createServerAxios();
	await r.put(`/work-hours-record/save`, data);
}

export async function oneKeyApi(workHourId: number, status: number) {
	const r = await createServerAxios();
	await r.get(`/work-hours-record/one-key`, {
		params: { workHourId, status },
	});
}
