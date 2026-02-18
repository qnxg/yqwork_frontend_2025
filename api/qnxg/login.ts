"use server";

import { createServerAxios } from "@/lib/request";

/**
 * 登录
 */
export async function postLoginApi(username: string, password: string) {
	const r = await createServerAxios(false);
	const token: string = await r.post("/login", { username, password });
	return token;
}

/**
 * 获取二维码
 */
export async function getAuthQrCodeApi() {
	const r = await createServerAxios(false);
	const code: string = await r.get("/auth_qrcode");
	return code;
}

export type IAuthQrCodeStatus = "unused" | "using" | "used";

/**
 * 获取二维码状态
 */
export async function getAuthQrCodeStatusApi(code: string) {
	const r = await createServerAxios(false);
	const status: IAuthQrCodeStatus = await r.get(`/auth_qrcode/status/${code}`);
	return status;
}

/**
 * 获取二维码信息
 */
export async function getAuthQrCodeTokenApi(code: string) {
	const r = await createServerAxios(false);
	const token: string = await r.get(`/auth_qrcode/token/${code}`);
	return token;
}
