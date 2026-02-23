import { getUserWhoAmI } from "@/api/qnxg/user";
import AppBar, { AppBarPayload } from "./AppBar";
import { getDepartmentPageApi } from "@/api/qnxg/department";
import { NotFoundError } from "@/utils/result";

export default async function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const whoami = await getUserWhoAmI();
	const department = (await getDepartmentPageApi()).find(
		(d) => d.id === whoami.user.info.departmentId,
	);
	if (!department) {
		throw new NotFoundError("用户所属部门不存在");
	}
	const payload: AppBarPayload = {
		user: whoami.user,
		department: department.name,
	};
	return (
		<div>
			<AppBar payload={payload}>{children}</AppBar>
		</div>
	);
}
