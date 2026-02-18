"use client";

import { Button, Collapse, Input, Toast } from "@douyinfe/semi-ui-19";
import { IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { useState } from "react";
import { putMiniConfigByIdApi } from "@/api/weihuda/miniConfig";
import { withToast } from "@/utils/action";
import { CHANGELOG_CONFIG_KEY } from "@/config";

interface ChangelogSectionRaw {
	title: string;
	details: string[];
}

interface ChangelogEntryRaw {
	time: string;
	content: ChangelogSectionRaw[];
}

interface ChangelogSectionWithId extends ChangelogSectionRaw {
	id: string;
}

interface ChangelogEntryWithId {
	id: string;
	time: string;
	content: ChangelogSectionWithId[];
}

function parseChangelog(value: string): ChangelogEntryWithId[] {
	try {
		const arr = JSON.parse(value || "[]") as ChangelogEntryRaw[];
		return arr.map((entry, ei) => ({
			id: `entry-${ei}-${entry.time}`,
			time: entry.time,
			content: (entry.content || []).map((sec, si) => ({
				id: `sec-${ei}-${si}`,
				title: sec.title,
				details: sec.details || [],
			})),
		}));
	} catch {
		return [];
	}
}

function toChangelogJson(entries: ChangelogEntryWithId[]): string {
	const arr: ChangelogEntryRaw[] = entries.map((e) => ({
		time: e.time,
		content: e.content.map((s) => ({
			title: s.title,
			details: s.details.filter((d) => d.trim() !== ""),
		})),
	}));
	return JSON.stringify(arr);
}

export interface ChangelogConfigTabProps {
	changelogStr: string;
	canEdit: boolean;
}

export default function ChangelogConfigTab({
	changelogStr,
	canEdit,
}: ChangelogConfigTabProps) {
	const [entries, setEntries] = useState<ChangelogEntryWithId[]>(() =>
		parseChangelog(changelogStr),
	);
	const [saving, setSaving] = useState(false);

	const handleAddEntry = () => {
		setEntries((prev) => [
			{
				id: `entry-${Date.now()}`,
				time: "",
				content: [
					{
						id: `sec-${Date.now()}`,
						title: "增加",
						details: [""],
					},
				],
			},
			...prev,
		]);
	};

	const handleRemoveEntry = (entryId: string) => {
		setEntries((prev) => prev.filter((e) => e.id !== entryId));
	};

	const handleUpdateEntryTime = (entryId: string, time: string) => {
		setEntries((prev) =>
			prev.map((e) => (e.id === entryId ? { ...e, time } : e)),
		);
	};

	const handleAddSection = (entryId: string) => {
		setEntries((prev) =>
			prev.map((e) =>
				e.id === entryId
					? {
							...e,
							content: [
								...e.content,
								{
									id: `sec-${Date.now()}`,
									title: "",
									details: [""],
								},
							],
						}
					: e,
			),
		);
	};

	const handleRemoveSection = (entryId: string, sectionId: string) => {
		setEntries((prev) =>
			prev.map((e) =>
				e.id === entryId
					? {
							...e,
							content: e.content.filter((s) => s.id !== sectionId),
						}
					: e,
			),
		);
	};

	const handleUpdateSectionTitle = (
		entryId: string,
		sectionId: string,
		title: string,
	) => {
		setEntries((prev) =>
			prev.map((e) =>
				e.id === entryId
					? {
							...e,
							content: e.content.map((s) =>
								s.id === sectionId ? { ...s, title } : s,
							),
						}
					: e,
			),
		);
	};

	const handleUpdateSectionDetails = (
		entryId: string,
		sectionId: string,
		details: string[],
	) => {
		setEntries((prev) =>
			prev.map((e) =>
				e.id === entryId
					? {
							...e,
							content: e.content.map((s) =>
								s.id === sectionId ? { ...s, details } : s,
							),
						}
					: e,
			),
		);
	};

	const handleSave = async () => {
		const invalid = entries.some((e) => !e.time.trim());
		if (invalid) {
			Toast.warning("请填写每条更新日志的时间");
			return;
		}
		setSaving(true);
		try {
			await withToast(
				() =>
					putMiniConfigByIdApi(CHANGELOG_CONFIG_KEY, toChangelogJson(entries)),
				"更新日志已保存",
			);
		} catch {
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-4">
			{canEdit && (
				<Button type="secondary" icon={<IconPlus />} onClick={handleAddEntry}>
					添加更新日志
				</Button>
			)}

			<div className="space-y-2">
				<Collapse keepDOM>
					{entries.map((entry) => (
						<Collapse.Panel
							key={entry.id}
							itemKey={entry.id}
							header={
								<div className="flex items-center justify-between w-full pr-2">
									{canEdit ? (
										<span onClick={(e) => e.stopPropagation()}>
											<Input
												value={entry.time}
												onChange={(v) =>
													handleUpdateEntryTime(entry.id, String(v ?? ""))
												}
												placeholder="时间，如 2025-12-05"
												style={{ width: 160 }}
												size="small"
											/>
										</span>
									) : (
										<span className="font-medium">
											{entry.time || "未填写时间"}
										</span>
									)}
									{canEdit && (
										<Button
											theme="borderless"
											type="danger"
											size="small"
											icon={<IconDelete />}
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveEntry(entry.id);
											}}
										>
											删除
										</Button>
									)}
								</div>
							}
						>
							<div
								className="p-3 pt-0 space-y-4"
								onClick={(e) => e.stopPropagation()}
							>
								{entry.content.map((section) => (
									<div
										key={section.id}
										className="rounded border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] p-3"
									>
										<div className="flex items-center gap-2 mb-2">
											{canEdit ? (
												<Input
													value={section.title}
													onChange={(v) =>
														handleUpdateSectionTitle(
															entry.id,
															section.id,
															String(v ?? ""),
														)
													}
													placeholder="标题，如：增加、修复"
													style={{ width: 120 }}
													size="small"
												/>
											) : (
												<span className="font-medium">{section.title}</span>
											)}
											{canEdit && (
												<Button
													theme="borderless"
													type="danger"
													size="small"
													icon={<IconDelete />}
													onClick={() =>
														handleRemoveSection(entry.id, section.id)
													}
												>
													删除此块
												</Button>
											)}
										</div>
										<ul className="list-disc list-inside text-sm text-[var(--semi-color-text-2)] space-y-1">
											{canEdit
												? section.details.map((detail, di) => (
														<li key={di} className="flex items-center gap-2">
															<Input
																value={detail}
																onChange={(v) => {
																	const next = [...section.details];
																	next[di] = String(v ?? "");
																	handleUpdateSectionDetails(
																		entry.id,
																		section.id,
																		next,
																	);
																}}
																style={{ flex: 1 }}
																size="small"
															/>
															<Button
																theme="borderless"
																type="danger"
																size="small"
																icon={<IconDelete />}
																onClick={() => {
																	const next = section.details.filter(
																		(_, i) => i !== di,
																	);
																	handleUpdateSectionDetails(
																		entry.id,
																		section.id,
																		next.length ? next : [""],
																	);
																}}
															/>
														</li>
													))
												: section.details.map((d, i) => <li key={i}>{d}</li>)}
										</ul>
										{canEdit && (
											<Button
												size="small"
												theme="borderless"
												icon={<IconPlus />}
												className="mt-2"
												onClick={() => {
													handleUpdateSectionDetails(entry.id, section.id, [
														...section.details,
														"",
													]);
												}}
											>
												添加一条详情
											</Button>
										)}
									</div>
								))}
								{canEdit && (
									<Button
										size="small"
										type="secondary"
										icon={<IconPlus />}
										onClick={() => handleAddSection(entry.id)}
									>
										添加内容块
									</Button>
								)}
							</div>
						</Collapse.Panel>
					))}
				</Collapse>
			</div>

			{canEdit && (
				<Button
					type="primary"
					onClick={handleSave}
					loading={saving}
					className="mt-4"
				>
					保存
				</Button>
			)}
		</div>
	);
}
