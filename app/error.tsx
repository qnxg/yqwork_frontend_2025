"use client"; // Error Boundary 必须是 Client Component

import { parseDigestPayload } from "@/utils/result";
import {
	IllustrationNoContent,
	IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Empty } from "@douyinfe/semi-ui-19";
import { useEffect, useMemo } from "react";

export default function GlobalError({
	error,
}: {
	error: Error & { name: string };
}) {
	useEffect(() => {
		console.error("Global Error:", error);
	}, [error]);

	const msg = useMemo(() => {
		const payload = parseDigestPayload(error);
		if (payload) {
			let msg = payload.message || "未知错误，请重试或联系管理员";
			if (payload.name) msg += ` (错误代码：${payload.name})`;
			return msg;
		}
		return "未知错误，请重试或联系管理员";
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
