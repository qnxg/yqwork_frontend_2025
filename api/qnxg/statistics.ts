"use server";

import { createServerAxios } from "@/utils/request";

export type StatisticsResponseData = {
	[key: string]: {
		/** 状态 */
		status: number;
		/** 对应状态的个数 */
		count: number;
	}[];
};

/**
 * 查询各项数据。（主要是微生活小程序的）
 */
export async function getStatisticsApi() {
	const r = await createServerAxios();
	const data: StatisticsResponseData = await r.get("/statistics");
	return data;
}
