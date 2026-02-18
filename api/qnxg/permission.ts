"use server";

import { createServerAxios } from "@/lib/request";

export interface IPermission {
	id: number;
	name: string;
	// 权限标识
	permission: string;
}

export type IPermissionBasicInfo = Pick<IPermission, "name" | "permission">;

export async function getPermissionPageApi() {
	const r = await createServerAxios();
	const list: IPermission[] = await r.get("/permission");
	return list;
}

export async function postPermissionApi(postData: IPermissionBasicInfo) {
	const r = await createServerAxios();
	const permission: IPermission = await r.post("/permission", postData);
	return permission;
}

export async function putPermissionByIdApi(
	id: number,
	putData: IPermissionBasicInfo,
) {
	const r = await createServerAxios();
	const permission: IPermission = await r.put(`/permission/${id}`, putData);
	return permission;
}

export async function deletePermissionByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/permission/${id}`);
}
