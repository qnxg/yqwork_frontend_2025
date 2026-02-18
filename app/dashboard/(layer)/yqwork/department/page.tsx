import { getDepartmentPageApi } from "@/api/qnxg/department";
import { getUserWhoAmI } from "@/api/qnxg/user";
import DepartmentIndex, { DepartmentIndexPayload } from "./DepartmentIndex";

export const dynamic = "force-dynamic";

export default async function Page() {
	const whoami = await getUserWhoAmI();
	const list = await getDepartmentPageApi();
	const payload: DepartmentIndexPayload = {
		departments: list,
		permissions: whoami.permissions.map((p) => p.permission),
	};
	return <DepartmentIndex payload={payload} />;
}
