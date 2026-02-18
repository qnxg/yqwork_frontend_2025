import { getJifenGoodsApi } from "@/api/weihuda/jifenGoods";
import { getUserWhoAmI } from "@/api/qnxg/user";
import JifenGoodsIndex from "./JifenGoodsIndex";

export const dynamic = "force-dynamic";

export default async function JifenGoodsPage() {
	const [goods, whoami] = await Promise.all([
		getJifenGoodsApi(),
		getUserWhoAmI(),
	]);

	const permissions = whoami.permissions.map((p) => p.permission);

	return (
		<JifenGoodsIndex
			initialGoods={goods}
			permissions={permissions}
			permissionPrefix="hdwsh:jifenGoods"
		/>
	);
}
