import { getUserWhoAmI } from "@/api/qnxg/user";
import WorkHoursIndex, { WorkHoursIndexPayload } from "./WorkHoursIndex";
import { getWorkHoursPageApi } from "@/api/qnxg/workHours";

export const dynamic = "force-dynamic";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const page = params.page ? Number(params.page) : 1;
	const pageSize = params.pageSize ? Number(params.pageSize) : 10;

	const whoami = await getUserWhoAmI();
	const list = await getWorkHoursPageApi({ page, pageSize });
	const payload: WorkHoursIndexPayload = {
		list: list.rows,
		total: list.count,
		permissions: whoami.permissions.map((p) => p.permission),
		page,
		pageSize,
	};
	return <WorkHoursIndex payload={payload} />;
}
