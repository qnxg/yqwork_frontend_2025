"use server";

import { createServerAxios } from "@/utils/request";

export interface IDepartment {
	id: number;
	name: string;
	desc: string;
}

export async function getDepartmentPageApi() {
	const r = await createServerAxios();
	const list: IDepartment[] = await r.get("/department");
	return list;
}

export type IDepartmentBasicInfo = Pick<IDepartment, "name" | "desc">;

export async function postDepartmentApi(postData: IDepartmentBasicInfo) {
	const r = await createServerAxios();
	const department: IDepartment = await r.post("/department", postData);
	return department;
}

export async function putDepartmentByIdApi(
	id: number,
	putData: IDepartmentBasicInfo,
) {
	const r = await createServerAxios();
	await r.put(`/department/${id}`, putData);
}

export async function deleteDepartmentByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/department/${id}`);
}
