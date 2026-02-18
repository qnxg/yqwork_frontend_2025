import { getUserWhoAmI } from "@/api/qnxg/user";
import { getMyWorkHoursRecordApi } from "@/api/qnxg/workHoursRecord";
import MyWorkHoursRecordIndex from "./MyWorkHoursRecordIndex";
import { MyWorkHoursRecordPayload } from "./MyWorkHoursRecordIndex";
import { NotFoundError } from "@/utils/result";
import { getWorkHoursByIdApi } from "@/api/qnxg/workHours";

export const dynamic = "force-dynamic";

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const workHoursId = Number(id);
	const whoami = await getUserWhoAmI();
	const workHoursRecord = await getMyWorkHoursRecordApi(workHoursId);
	const workHours = await getWorkHoursByIdApi(workHoursId);
	if (!workHours) {
		throw new NotFoundError("工时申报记录不存在");
	}
	const payload: MyWorkHoursRecordPayload = {
		user: whoami.user,
		record: workHoursRecord,
		workHours,
		permissions: whoami.permissions.map((p) => p.permission),
	};
	return <MyWorkHoursRecordIndex payload={payload} />;
}
