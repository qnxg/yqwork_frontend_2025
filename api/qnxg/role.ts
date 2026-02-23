"use server";

import { createServerAxios } from "@/utils/request";
import { IPermission } from "./permission";

export interface IRole {
	id: number;
	name: string;
	permissions: IPermission[];
}

export interface IRoleBasicInfo extends Pick<IRole, "name"> {
	permissionIds: number[];
}

export async function getRolePageApi() {
	const r = await createServerAxios();
	const res: IRole[] = await r.get("/role");
	return res;
}

export async function postRoleApi(postData: IRoleBasicInfo) {
	const r = await createServerAxios();
	const res: IRole = await r.post("/role", postData);
	return res;
}

export async function putRoleByIdApi(id: number, putData: IRoleBasicInfo) {
	const r = await createServerAxios();
	const res: IRole = await r.put(`/role/${id}`, putData);
	return res;
}

export async function deleteRoleByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/role/${id}`);
}
