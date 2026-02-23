import { getUserWhoAmI } from "@/api/qnxg/user";
import { getDepartmentPageApi } from "@/api/qnxg/department";
import ProfileIndex from "./ProfileIndex";
import { IUser } from "@/api/qnxg/user";
import { IDepartment } from "@/api/qnxg/department";

export const dynamic = "force-dynamic";

export interface ProfilePayload {
	user: IUser;
	departments: IDepartment[];
}

export default async function ProfilePage() {
	const whoami = await getUserWhoAmI();
	const departments = await getDepartmentPageApi();
	const payload: ProfilePayload = {
		user: whoami.user,
		departments,
	};
	return <ProfileIndex payload={payload} />;
}
