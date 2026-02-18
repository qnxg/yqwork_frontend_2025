import { getPermissionPageApi } from "@/api/qnxg/permission";
import { getRolePageApi } from "@/api/qnxg/role";
import { getUserWhoAmI } from "@/api/qnxg/user";
import RoleIndex, { RoleIndexPayload } from "./RoleIndex";

export const dynamic = "force-dynamic";

export default async function Page() {
	const [roles, permissions, whoami] = await Promise.all([
		getRolePageApi(),
		getPermissionPageApi(),
		getUserWhoAmI(),
	]);
	const payload: RoleIndexPayload = {
		roles,
		permissions,
		userPermissions: whoami.permissions.map((p) => p.permission),
	};
	return <RoleIndex payload={payload} />;
}
