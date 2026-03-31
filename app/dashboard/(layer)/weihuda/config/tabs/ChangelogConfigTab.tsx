"use client";

import { Button, Collapse, Input, Toast } from "@douyinfe/semi-ui-19";
import { IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { useRef, useState } from "react";
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

interface ChangelogSectionWithId {
	id: string;
	title: string;
	details: ChangelogDetailWithId[];
}

interface ChangelogDetailWithId {
	id: string;
	text: string;
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
				details: (sec.details || []).map((detail, di) => ({
					id: `detail-${ei}-${si}-${di}`,
					text: detail,
				})),
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
			details: s.details
				.map((d) => d.text)
				.filter((detail) => detail.trim() !== ""),
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
	const localIdRef = useRef(0);

	const createLocalId = (prefix: string) => `${prefix}-${localIdRef.current++}`;

	const handleAddEntry = () => {
		setEntries((prev) => [
			{
				id: createLocalId("entry"),
				time: "",
				content: [
					{
						id: createLocalId("sec"),
						title: "增加",
						details: [{ id: createLocalId("detail"), text: "" }],
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
									id: createLocalId("sec"),
									title: "",
									details: [{ id: createLocalId("detail"), text: "" }],
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
		details: ChangelogDetailWithId[],
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
		} catch {}
		setSaving(false);
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
												? section.details.map((detail) => (
														<li key={detail.id} className="flex items-center gap-2">
															<Input
																value={detail.text}
																onChange={(v) => {
																	const next = section.details.map((d) =>
																		d.id === detail.id
																			? { ...d, text: String(v ?? "") }
																			: d,
																	);
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
																		(d) => d.id !== detail.id,
																	);
																	handleUpdateSectionDetails(
																		entry.id,
																		section.id,
																		next.length
																			? next
																			: [
																					{
																						id: createLocalId("detail"),
																						text: "",
																					},
																				],
																	);
																}}
															/>
														</li>
													))
												: section.details.map((d) => <li key={d.id}>{d.text}</li>)}
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
														{
															id: createLocalId("detail"),
															text: "",
														},
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
