"use client";

import { useRefreshOnPathnameChange } from "@/utils/hooks";
import { Tabs } from "@douyinfe/semi-ui-19";
import { useRouter, usePathname } from "next/navigation";

const TAB_KEYS = ["goods", "rule", "exchange", "record"] as const;
type JifenTabKey = (typeof TAB_KEYS)[number];

const JIFEN_BASE = "/dashboard/weihuda/jifen";

function getActiveKeyFromPathname(pathname: string): JifenTabKey {
	const segment = pathname
		.replace(JIFEN_BASE, "")
		.replace(/^\//, "")
		.split("/")[0];
	return TAB_KEYS.includes(segment as JifenTabKey)
		? (segment as JifenTabKey)
		: "goods";
}

export default function JifenLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const activeKey = getActiveKeyFromPathname(pathname);

	const handleTabChange = (key: string) => {
		router.push(`${JIFEN_BASE}/${key}`, { scroll: false });
	};

	useRefreshOnPathnameChange(pathname);

	return (
		<div>
			<Tabs
				type="line"
				activeKey={activeKey}
				onChange={handleTabChange}
				className="mx-2"
			>
				<Tabs.TabPane tab="奖品" itemKey="goods">
					{activeKey === "goods" && children}
				</Tabs.TabPane>
				<Tabs.TabPane tab="积分规则" itemKey="rule">
					{activeKey === "rule" && children}
				</Tabs.TabPane>
				<Tabs.TabPane tab="兑换记录" itemKey="exchange">
					{activeKey === "exchange" && children}
				</Tabs.TabPane>
				<Tabs.TabPane tab="积分记录" itemKey="record">
					{activeKey === "record" && children}
				</Tabs.TabPane>
			</Tabs>
		</div>
	);
}
