"use client"; // Error Boundary 必须是 Client Component

import {
	IllustrationNoContent,
	IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Empty } from "@douyinfe/semi-ui-19";
import { useEffect, useMemo } from "react";

export default function DashboardError({
	error,
}: {
	error: Error & { name: string };
}) {
	useEffect(() => {
		console.error("Dashboard Error:", error);
	}, [error]);

	const msg = useMemo(() => {
		let msg = error.message || "未知错误，请重试或联系管理员";
		if (error.name) msg += ` (错误代码：${error.name})`;
		return msg;
	}, [error]);

	return (
		<Empty
			image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}
			darkModeImage={
				<IllustrationNoContentDark style={{ width: 150, height: 150 }} />
			}
			title="加载失败，请刷新重试"
			description={msg}
			className="mt-12"
		></Empty>
	);
}
