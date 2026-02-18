import { getJifenRuleApi } from "@/api/weihuda/jifenRule";
import { getUserWhoAmI } from "@/api/qnxg/user";
import JifenRuleIndex from "./JifenRuleIndex";

export const dynamic = "force-dynamic";

export default async function JifenRulePage() {
	const [rules, whoami] = await Promise.all([
		getJifenRuleApi(),
		getUserWhoAmI(),
	]);

	const permissions = whoami.permissions.map((p) => p.permission);

	return (
		<JifenRuleIndex
			initialRules={rules}
			permissions={permissions}
			permissionPrefix="hdwsh:jifenRule"
		/>
	);
}
