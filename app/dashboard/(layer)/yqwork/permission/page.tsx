import { getPermissionPageApi } from "@/api/qnxg/permission";
import { getUserWhoAmI } from "@/api/qnxg/user";
import PermissionIndex, { PermissionIndexPayload } from "./PermissionIndex";

export const dynamic = "force-dynamic";

export default async function Page() {
	const [permissions, whoami] = await Promise.all([
		getPermissionPageApi(),
		getUserWhoAmI(),
	]);
	const payload: PermissionIndexPayload = {
		permissions,
		userPermissions: whoami.permissions.map((p) => p.permission),
	};
	return <PermissionIndex payload={payload} />;
}
