import { getUserWhoAmI } from "@/api/qnxg/user";
import { getWorkHoursRecordPageApi } from "@/api/qnxg/workHoursRecord";
import GenWorkHoursRecordIndex from "./GenWorkHoursIndex";
import { GenWorkHoursRecordPayload } from "./config";
import { NotFoundError } from "@/utils/result";
import {
	getWorkHoursByIdApi,
	getWorkHoursStatisticsApi,
} from "@/api/qnxg/workHours";
import { getDepartmentPageApi } from "@/api/qnxg/department";

export const dynamic = "force-dynamic";

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const workHoursId = Number(id);
	const whoami = await getUserWhoAmI();
	const workHours = await getWorkHoursByIdApi(workHoursId);
	const departmentList = await getDepartmentPageApi();

	if (!workHours) {
		throw new NotFoundError("工时申报记录不存在");
	}

	const workHoursRecords = await getWorkHoursRecordPageApi(workHoursId);
	const statistics = await getWorkHoursStatisticsApi(workHoursId);

	const payload: GenWorkHoursRecordPayload = {
		user: whoami.user,
		workHours,
		workHoursRecords,
		statistics,
		departmentList,
		permissions: whoami.permissions.map((p) => p.permission),
	};

	return <GenWorkHoursRecordIndex payload={payload} />;
}
