"use client";

import { Toast } from "@douyinfe/semi-ui-19";
import { formatToString } from ".";
import { parseDigestPayload } from "./result";

/**
 * 在客户端调用 Server Action 时的错误处理包装
 * 捕获错误并显示 Toast，同时重新抛出以便调用方处理
 */
export async function withToast<T>(
	fn: () => Promise<T>,
	successMessage?: string,
): Promise<T> {
	try {
		const result = await fn();
		if (successMessage) {
			Toast.success(successMessage);
		}
		return result;
	} catch (err) {
		if (err instanceof Error) {
			const payload = parseDigestPayload(err);
			if (payload) {
				Toast.error(payload.message ?? "操作失败");
				throw new Error(payload.message);
			}
			Toast.error("操作失败");
		} else {
			Toast.error(formatToString(err));
		}
		throw err;
	}
}
