import { getJifenGoodsApi } from "@/api/weihuda/jifenGoods";
import { getGoodsRecordPageApi } from "@/api/weihuda/goodsRecord";
import { getUserWhoAmI } from "@/api/qnxg/user";
import JifenExchangeIndex from "./JifenExchangeIndex";

export const dynamic = "force-dynamic";

export default async function JifenExchangePage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const page = params.page ? Number(params.page) : 1;
	const pageSize = params.pageSize ? Number(params.pageSize) : 10;
	const stuId = (params.stuId as string)?.trim() || undefined;
	const goodsId = params.goodsId ? Number(params.goodsId) : undefined;
	const status =
		params.status != null && params.status !== ""
			? Number(params.status)
			: undefined;

	const [goods, goodsRecordPage, whoami] = await Promise.all([
		getJifenGoodsApi(),
		getGoodsRecordPageApi({ page, pageSize, stuId, goodsId, status }),
		getUserWhoAmI(),
	]);

	const permissions = whoami.permissions.map((p) => p.permission);

	return (
		<JifenExchangeIndex
			initialData={goodsRecordPage}
			goodsList={goods}
			permissions={permissions}
		/>
	);
}
