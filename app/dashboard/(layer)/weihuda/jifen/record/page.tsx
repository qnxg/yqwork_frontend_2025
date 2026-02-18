import { getJifenRecordPageApi } from "@/api/weihuda/jifenRecord";
import { getUserWhoAmI } from "@/api/qnxg/user";
import JifenRecordIndex from "./JifenRecordIndex";

export const dynamic = "force-dynamic";

export default async function JifenRecordPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const page = params.page ? Number(params.page) : 1;
	const pageSize = params.pageSize ? Number(params.pageSize) : 10;
	const key = (params.key as string)?.trim() || undefined;
	const param = (params.param as string)?.trim() || undefined;
	const stuId = (params.stuId as string)?.trim() || undefined;

	const [jifenRecordPage, whoami] = await Promise.all([
		getJifenRecordPageApi({ page, pageSize, key, param, stuId }),
		getUserWhoAmI(),
	]);

	const permissions = whoami.permissions.map((p) => p.permission);

	return (
		<JifenRecordIndex
			initialData={jifenRecordPage}
			permissions={permissions}
			permissionPrefix="hdwsh:jifenRecord"
		/>
	);
}
