"use server";

import { createServerAxios } from "@/utils/request";
import { IPageQueryData } from "../interface";
import { IPermission } from "./permission";
import { IRole } from "./role";

export interface IUserBasicInfo {
	name: string;
	stuId: string;
	username?: string;
	email?: string;
	xueyuan: number;
	gangwei?: string;
	zaiku: boolean;
	qingonggang: boolean;
	status: number;
	departmentId: number;
}

export interface IUser {
	id: number;
	info: IUserBasicInfo;
	lastLogin?: string;
}

export interface IUserExtraInfo {
	password: string;
	roleId: number[];
}

export interface IUserPageResponseData {
	count: number;
	rows: IUser[];
	userRolesMap: { [userId: number]: IRole[] };
}

export interface IUserPageQueryData
	extends
		IPageQueryData,
		Partial<
			Pick<IUserBasicInfo, "stuId" | "name" | "departmentId" | "status">
		> {}

export async function getUserPageApi(queryData: IUserPageQueryData) {
	const r = await createServerAxios();
	const list: IUserPageResponseData = await r.get("/user", {
		params: queryData,
	});
	return list;
}

export type IUserPostData = IUserBasicInfo & IUserExtraInfo;

export async function postUserApi(postData: IUserPostData) {
	const r = await createServerAxios();
	const user: IUser = await r.post("/user", postData);
	return user;
}

export type IUserPutData = IUserBasicInfo & Partial<IUserExtraInfo>;

export async function putUserByIdApi(id: number, putData: IUserPutData) {
	const r = await createServerAxios();
	const user: IUser = await r.put(`/user/${id}`, putData);
	return user;
}

export async function deleteUserByIdApi(id: number) {
	const r = await createServerAxios();
	await r.delete(`/user/${id}`);
}

export async function putUserPwdApi(oldPwd: string, newPwd: string) {
	const r = await createServerAxios();
	await r.put("/user/pwd", {
		oldPassword: oldPwd,
		newPassword: newPwd,
	});
}

export interface IUserWhoAmIResponseData {
	user: IUser;
	permissions: IPermission[];
}

export async function getUserWhoAmI() {
	const r = await createServerAxios();
	const res: IUserWhoAmIResponseData = await r.get("/user/whoami");
	return res;
}
