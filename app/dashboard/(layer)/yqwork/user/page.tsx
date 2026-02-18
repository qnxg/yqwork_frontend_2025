import { getUserPageApi, getUserWhoAmI } from "@/api/qnxg/user";
import { getDepartmentPageApi } from "@/api/qnxg/department";
import { getRolePageApi } from "@/api/qnxg/role";
import UserIndex from "./UserIndex";
import { UserIndexPayload } from "./UserIndex";
import { IUserPageQueryData } from "@/api/qnxg/user";

export const dynamic = "force-dynamic";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const queryData: IUserPageQueryData = {
		page: params.page ? Number(params.page) : 1,
		pageSize: params.pageSize ? Number(params.pageSize) : 10,
		stuId: params.stuId as string | undefined,
		name: params.name as string | undefined,
		departmentId: params.departmentId ? Number(params.departmentId) : undefined,
		status: params.status ? Number(params.status) : undefined,
	};

	const whoami = await getUserWhoAmI();
	const departments = await getDepartmentPageApi();
	const roles = await getRolePageApi();
	const userPageResponse = await getUserPageApi(queryData);

	const payload: UserIndexPayload = {
		user: whoami.user,
		departments,
		roles,
		data: userPageResponse,
		permissions: whoami.permissions.map((p) => p.permission),
		queryData,
	};

	return <UserIndex payload={payload} />;
}
