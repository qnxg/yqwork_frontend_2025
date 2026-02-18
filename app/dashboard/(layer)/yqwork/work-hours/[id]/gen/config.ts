import { IDepartment } from "@/api/qnxg/department";
import { IUser } from "@/api/qnxg/user";
import { IWorkHours, IWorkHoursStatistics } from "@/api/qnxg/workHours";
import { IWorkHoursRecord } from "@/api/qnxg/workHoursRecord";

export interface GenWorkHoursRecordPayload {
	user: IUser;
	workHours: IWorkHours;
	workHoursRecords: IWorkHoursRecord[];
	statistics: IWorkHoursStatistics[];
	departmentList: IDepartment[];
	permissions: string[];
}

export const TAB_KEYS = ["audit", "table", "final"] as const;
export type GenTabKey = (typeof TAB_KEYS)[number];

// export const TAB_CONFIG = [
// 	{ key: "audit", label: "收集结果" },
// 	{ key: "table", label: "制作工资表" },
// 	{ key: "final", label: "结果视图" },
// ];
