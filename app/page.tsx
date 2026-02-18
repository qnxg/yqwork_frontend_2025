import { getUserWhoAmI } from "@/api/qnxg/user";
import { redirect } from "next/navigation";

export default async function Home() {
	// 单纯鉴权一下，当前鉴权信息过期/不存在的话会自动进行重定向
	await getUserWhoAmI();
	redirect("/dashboard");
}
