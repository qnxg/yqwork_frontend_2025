import { getStatisticsApi } from "@/api/qnxg/statistics";
import { getDepartmentWorkHoursRecordApi } from "@/api/qnxg/workHoursRecord";
import { getWorkHoursPageApi } from "@/api/qnxg/workHours";
import { getUserWhoAmI } from "@/api/qnxg/user";
import HomeIndex from "./HomeIndex";

export const dynamic = "force-dynamic";

const WORK_HOUR_STATUS_SUBMITTING = 1; // 申报中
const WORK_HOUR_RECORD_STATUS_PENDING_APPROVAL = 1; // 部门负责人审核

// 从 statistics 取待办数量：问题反馈未确认(0)、积分兑换待后台确认(0)+待收(1)、知湖待发布(0)
function getTodoFromStatistics(
	data: Awaited<ReturnType<typeof getStatisticsApi>>,
) {
	let todoFeedback = 0;
	let todoGoodsRecord = 0;
	let todoZhihu = 0;
	if (!data) return { todoFeedback, todoGoodsRecord, todoZhihu };
	const feedbackItems = data["feedback"] ?? [];
	const goodsItems = data["goods-record"] ?? [];
	const zhihuItems = data["zhihu"] ?? [];
	todoFeedback = feedbackItems.find((i) => i.status === 0)?.count ?? 0;
	todoGoodsRecord =
		(goodsItems.find((i) => i.status === 0)?.count ?? 0) +
		(goodsItems.find((i) => i.status === 1)?.count ?? 0);
	todoZhihu = zhihuItems.find((i) => i.status === 0)?.count ?? 0;
	return { todoFeedback, todoGoodsRecord, todoZhihu };
}

export default async function Page() {
	const { user } = await getUserWhoAmI();

	let workHoursSubmitting:
		| Awaited<ReturnType<typeof getWorkHoursPageApi>>["rows"]
		| undefined = undefined;
	let todoFeedback = 0;
	let todoGoodsRecord = 0;
	let todoZhihu = 0;
	let todoWorkHoursDept = 0;

	try {
		const list = await getWorkHoursPageApi({ page: 1, pageSize: 20 });
		workHoursSubmitting = list.rows.filter(
			(item) => item.status === WORK_HOUR_STATUS_SUBMITTING,
		);
	} catch {
		// 无权限或接口失败时不展示申报中区块
	}

	try {
		const stats = await getStatisticsApi();
		const todo = getTodoFromStatistics(stats);
		todoFeedback = todo.todoFeedback;
		todoGoodsRecord = todo.todoGoodsRecord;
		todoZhihu = todo.todoZhihu;
	} catch {
		// 无 hdwsh:statistics:query 或接口失败时待办为 0
	}

	// 当前部门待审核工时：从申报中的工时下获取部门记录，统计状态为「部门负责人审核」的数量
	if (workHoursSubmitting?.length) {
		try {
			for (const wh of workHoursSubmitting) {
				const records = await getDepartmentWorkHoursRecordApi(wh.id);
				todoWorkHoursDept += records.filter(
					(r) => r.status === WORK_HOUR_RECORD_STATUS_PENDING_APPROVAL,
				).length;
			}
		} catch {
			// 无 checkDepartment 权限或接口失败
		}
	}

	return (
		<HomeIndex
			userInfo={user}
			workHours={workHoursSubmitting}
			todoFeedback={todoFeedback}
			todoGoodsRecord={todoGoodsRecord}
			todoZhihu={todoZhihu}
			todoWorkHoursDept={todoWorkHoursDept}
		/>
	);
}
