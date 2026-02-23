"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { GenTabKey, GenWorkHoursRecordPayload, TAB_KEYS } from "./config";

import { Tabs } from "@douyinfe/semi-ui-19";
import { AuditTab, TableTab, FinalTab } from "./tabs";
const GenWorkHoursRecordIndex = ({
	payload,
}: {
	payload: GenWorkHoursRecordPayload;
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tabFromUrl = searchParams.get("tab");
	const activeKey: GenTabKey = TAB_KEYS.includes(tabFromUrl as GenTabKey)
		? (tabFromUrl as GenTabKey)
		: "audit";

	const updateTab = (key: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set("tab", key);
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	return (
		<div>
			<Tabs
				type="line"
				activeKey={activeKey}
				onChange={(key) => updateTab(key)}
				keepDOM={false}
				className="mx-2"
			>
				<Tabs.TabPane tab="学期" itemKey="audit">
					<AuditTab payload={payload} />
				</Tabs.TabPane>
				<Tabs.TabPane tab="制作工资表" itemKey="table">
					<TableTab payload={payload} />
				</Tabs.TabPane>
				<Tabs.TabPane tab="结果视图" itemKey="final">
					<FinalTab payload={payload} />
				</Tabs.TabPane>
			</Tabs>
		</div>
	);
};

export default GenWorkHoursRecordIndex;
