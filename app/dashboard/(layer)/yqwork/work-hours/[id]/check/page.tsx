import { getUserWhoAmI } from "@/api/qnxg/user";
import { getDepartmentWorkHoursRecordApi } from "@/api/qnxg/workHoursRecord";
import CheckWorkHoursRecordIndex from "./CheckWorkHoursRecordIndex";
import { CheckWorkHoursRecordPayload } from "./CheckWorkHoursRecordIndex";
import { NotFoundError } from "@/utils/result";
import { getWorkHoursByIdApi } from "@/api/qnxg/workHours";
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

	const workHoursRecords = await getDepartmentWorkHoursRecordApi(workHoursId);

	const payload: CheckWorkHoursRecordPayload = {
		user: whoami.user,
		workHours,
		workHoursRecords,
		departmentList,
	};

	return <CheckWorkHoursRecordIndex payload={payload} />;
}
