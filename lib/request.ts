"use server";

import { API_URL_LOCAL } from "@/config";
import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppError, PermissionDeniedError, RequestError } from "@/utils/result";

/**
 * 从 cookie 获取 session token
 */
export async function getToken(): Promise<string | undefined> {
	const cookieStore = await cookies();
	return cookieStore.get("session")?.value;
}

/**
 * 创建带鉴权的 axios 实例，用于 Server Action
 * @param auth 是否需要鉴权，默认 true。登录等接口传 false
 */
export async function createServerAxios(auth = true): Promise<AxiosInstance> {
	let token: string | undefined;
	if (auth) {
		token = await getToken();
		if (!token) redirect("/login");
	}

	const instance = axios.create({
		baseURL: API_URL_LOCAL,
		timeout: 10000,
		withCredentials: true,
	});

	instance.interceptors.request.use((config) => {
		if (token) {
			config.headers["Authorization"] = token;
		}
		return config;
	});

	instance.interceptors.response.use(
		(result) => {
			const { code, msg, data } = result.data;
			if (code === 200) return data;
			if (code === 401) redirect("/login");
			if (code === 403) throw new PermissionDeniedError();
			return Promise.reject(new RequestError(msg || "请求失败"));
		},
		(err) => {
			if (err instanceof AppError) {
				return Promise.reject(err);
			}
			if (axios.isAxiosError(err) && err.response) {
				const { status, data } = err.response;
				if (status === 401) redirect("/login");
				if (status === 403) throw new PermissionDeniedError();
				const msg = (data as { msg?: string })?.msg || err.message;
				return Promise.reject(new RequestError(msg));
			}
			return Promise.reject(new RequestError(err.message || "请求失败"));
		},
	);

	return instance;
}
