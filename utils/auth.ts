import { deleteCookie } from "@/utils/cookie";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * 退出登录：清除 session 并跳转到登录页
 * @param router Next.js router，用于客户端跳转
 */
export function logout(router: AppRouterInstance) {
	deleteCookie("session");
	router.push("/login");
}
