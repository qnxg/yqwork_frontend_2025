"use client";

import {
	Button,
	DatePicker,
	Divider,
	Form,
	Input,
	Select,
	Toast,
} from "@douyinfe/semi-ui-19";
import { IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { useState } from "react";
import { putMiniConfigByIdApi } from "@/api/weihuda/miniConfig";
import { withToast } from "@/utils/action";
import dayjs from "dayjs";
import {
	NEXT_VACATION_DATE_CONFIG_KEY,
	CLASS_START_DATE_TABLE_CONFIG_KEY,
	FLEX_TIME_CONFIG_KEY,
} from "@/config";

const SEMESTER_TYPE_OPTIONS = [
	{ label: "秋季学期", value: "1" },
	{ label: "春季学期", value: "2" },
	{ label: "夏季学期", value: "3" },
];

/** 学期开始时间表：[[ "2025-3", "2026-07-05" ], ...] */
type ClassStartDateTable = [string, string][];

export interface ClassStartEntry {
	id: string;
	/** 学期 key，如 2025-3 */
	semesterKey: string;
	/** 学期开始日期 YYYY-MM-DD */
	startDate: string;
}

function parseClassStartDateTable(value: string): ClassStartEntry[] {
	try {
		const arr = JSON.parse(value || "[]") as ClassStartDateTable;
		return arr.map(([semesterKey, startDate], i) => ({
			id: `row-${i}-${semesterKey}`,
			semesterKey,
			startDate,
		}));
	} catch {
		return [];
	}
}

function toClassStartDateTable(entries: ClassStartEntry[]): string {
	const sorted = [...entries].sort(
		(a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
	);
	const arr: ClassStartDateTable = sorted.map((e) => [
		e.semesterKey,
		e.startDate,
	]);
	return JSON.stringify(arr);
}

// ---------- 调休信息 flexTime ----------
interface FlexTimeWeekDay {
	week: number;
	day: number;
}

interface FlexTimeItemRaw {
	from: FlexTimeWeekDay | null;
	to: FlexTimeWeekDay;
	desc: string;
	time: { xn: number; xq: number };
}

export interface FlexTimeEntry {
	id: string;
	from: FlexTimeWeekDay | null;
	to: FlexTimeWeekDay;
	desc: string;
	time: { xn: number; xq: number };
}

function parseFlexTime(value: string): FlexTimeEntry[] {
	try {
		const arr = JSON.parse(value || "[]") as FlexTimeItemRaw[];
		return arr.map((item, i) => ({
			id: `flex-${i}-${item.desc}`,
			from: item.from,
			to: item.to,
			desc: item.desc,
			time: item.time,
		}));
	} catch {
		return [];
	}
}

function toFlexTimeJson(entries: FlexTimeEntry[]): string {
	const arr: FlexTimeItemRaw[] = entries.map((e) => ({
		from: e.from,
		to: e.to,
		desc: e.desc,
		time: e.time,
	}));
	return JSON.stringify(arr);
}

const WEEKDAY_OPTIONS = [
	{ label: "周一", value: 1 },
	{ label: "周二", value: 2 },
	{ label: "周三", value: 3 },
	{ label: "周四", value: 4 },
	{ label: "周五", value: 5 },
	{ label: "周六", value: 6 },
	{ label: "周日", value: 7 },
];

export interface TermConfigTabProps {
	nextVacationDateStr: string;
	classStartDateTableStr: string;
	flexTimeStr: string;
	canEdit: boolean;
}

const FLEX_TYPE_OPTIONS = [
	{ label: "调课", value: "move" },
	{ label: "停课", value: "stop" },
];

export default function TermConfigTab({
	nextVacationDateStr,
	classStartDateTableStr,
	flexTimeStr,
	canEdit,
}: TermConfigTabProps) {
	const [nextVacationDate, setNextVacationDate] = useState<Date | undefined>(
		nextVacationDateStr ? new Date(nextVacationDateStr) : undefined,
	);
	const [entries, setEntries] = useState<ClassStartEntry[]>(() =>
		parseClassStartDateTable(classStartDateTableStr),
	);
	const [flexEntries, setFlexEntries] = useState<FlexTimeEntry[]>(() =>
		parseFlexTime(flexTimeStr),
	);
	const [saving, setSaving] = useState(false);

	const [addYear, setAddYear] = useState<string>("");
	const [addType, setAddType] = useState<string>("");
	const [addStartDate, setAddStartDate] = useState<Date | undefined>(undefined);

	// 调休添加表单
	const [addFlexXn, setAddFlexXn] = useState<string>("");
	const [addFlexXq, setAddFlexXq] = useState<string>("");
	const [addFlexDesc, setAddFlexDesc] = useState<string>("");
	const [addFlexType, setAddFlexType] = useState<string>("move");
	const [addFromWeek, setAddFromWeek] = useState<string>("");
	const [addFromDay, setAddFromDay] = useState<number | undefined>(undefined);
	const [addToWeek, setAddToWeek] = useState<string>("");
	const [addToDay, setAddToDay] = useState<number | undefined>(undefined);

	const handleAddEntry = () => {
		const year = addYear.trim();
		const typeVal = addType;
		if (!year || !typeVal || !addStartDate) return;
		const semesterKey = `${year}-${typeVal}`;
		const startDate = dayjs(addStartDate).format("YYYY-MM-DD");
		setEntries((prev) => {
			const newEntries = [
				...prev,
				{ id: `new-${Date.now()}`, semesterKey, startDate },
			];
			return newEntries.sort(
				(a, b) =>
					new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
			);
		});
		setAddYear("");
		setAddType("");
		setAddStartDate(undefined);
	};

	const handleRemoveEntry = (id: string) => {
		setEntries((prev) => prev.filter((e) => e.id !== id));
	};

	const handleAddFlexEntry = () => {
		const xn = Number(addFlexXn.trim());
		const xq = Number(addFlexXq);
		const desc = addFlexDesc.trim();
		const toWeek = Number(addToWeek.trim());
		const toDay = addToDay;
		if (
			!desc ||
			Number.isNaN(xn) ||
			!xq ||
			Number.isNaN(toWeek) ||
			toDay == null
		)
			return;
		const isStop = addFlexType === "stop";
		if (!isStop) {
			const fromWeek = Number(addFromWeek.trim());
			const fromDay = addFromDay;
			if (Number.isNaN(fromWeek) || fromDay == null) return;
			setFlexEntries((prev) => [
				{
					id: `flex-${Date.now()}`,
					from: { week: fromWeek, day: fromDay },
					to: { week: toWeek, day: toDay },
					desc,
					time: { xn, xq },
				},
				...prev,
			]);
		} else {
			setFlexEntries((prev) => [
				...prev,
				{
					id: `flex-${Date.now()}`,
					from: null,
					to: { week: toWeek, day: toDay },
					desc,
					time: { xn, xq },
				},
			]);
		}
		setAddFlexDesc("");
		setAddFromWeek("");
		setAddFromDay(undefined);
		setAddToWeek("");
		setAddToDay(undefined);
	};

	const handleRemoveFlexEntry = (id: string) => {
		setFlexEntries((prev) => prev.filter((e) => e.id !== id));
	};

	const handleSave = async () => {
		// 判断是否有重复的。已经排好序了，只需要判断相邻的学期是否重复
		const duplicateFlag = entries.some(
			(e, i) => i > 0 && e.semesterKey === entries[i - 1].semesterKey,
		);
		if (duplicateFlag) {
			Toast.error("学期开始时间表中存在重复学期");
			return;
		}
		setSaving(true);
		try {
			await withToast(() =>
				putMiniConfigByIdApi(
					NEXT_VACATION_DATE_CONFIG_KEY,
					nextVacationDate ? dayjs(nextVacationDate).format("YYYY-MM-DD") : "",
				),
			);
			await withToast(() =>
				putMiniConfigByIdApi(
					CLASS_START_DATE_TABLE_CONFIG_KEY,
					toClassStartDateTable(entries),
				),
			);
			await withToast(() =>
				putMiniConfigByIdApi(FLEX_TIME_CONFIG_KEY, toFlexTimeJson(flexEntries)),
			);
			Toast.success("保存成功");
		} catch {
		} finally {
			setSaving(false);
		}
	};

	const getSemesterName = (semesterKey: string) => {
		const [year, type] = semesterKey.split("-");
		const typeName = SEMESTER_TYPE_OPTIONS.find((o) => o.value === type)?.label;
		return `${year}学年${typeName}`;
	};

	const getFlexSemesterName = (xn: number, xq: number) => {
		const typeName = SEMESTER_TYPE_OPTIONS.find(
			(o) => o.value === String(xq),
		)?.label;
		return `${xn}学年${typeName}`;
	};

	const formatWeekDay = (w: FlexTimeWeekDay) =>
		`第${w.week}周${WEEKDAY_OPTIONS.find((o) => o.value === w.day)?.label ?? `周${w.day}`}`;

	return (
		<Form labelPosition="top" layout="vertical">
			<Form.Slot label="假期开始时间">
				<DatePicker
					placeholder="选择日期"
					value={nextVacationDate}
					onChange={(v) => setNextVacationDate(v as Date)}
					format="yyyy-MM-dd"
					type="date"
					style={{ width: 200 }}
					showClear={false}
					className="mt-2"
					disabled={!canEdit}
				/>
				<div className="mt-2 text-xs text-[var(--semi-color-text-2)]">
					若当前处于寒暑假，输入当前假期开始时间，否则输入下一寒暑假开始时间
				</div>
			</Form.Slot>

			<Form.Slot label="学期开始时间表">
				<div className="space-y-1 mt-3 h-[400px] overflow-y-auto">
					{canEdit && (
						<div className="flex flex-wrap items-end gap-3 p-3 rounded border border-dashed border-[var(--semi-color-border)]">
							<Input
								placeholder="学期开始年份，如 2025"
								value={addYear}
								onChange={(v) => setAddYear(String(v ?? ""))}
								style={{ width: 160 }}
							/>
							<Select
								placeholder="学期类型"
								value={addType}
								onChange={(v) => setAddType(String(v ?? ""))}
								optionList={SEMESTER_TYPE_OPTIONS}
								style={{ width: 140 }}
							/>
							<DatePicker
								placeholder="学期开始时间"
								value={addStartDate}
								onChange={(v) => setAddStartDate(v as Date)}
								format="yyyy-MM-dd"
								type="date"
								style={{ width: 180 }}
							/>
							<Button
								type="secondary"
								icon={<IconPlus />}
								onClick={handleAddEntry}
								disabled={!addYear.trim() || !addType || !addStartDate}
							>
								添加
							</Button>
						</div>
					)}
					{entries.map((entry) => (
						<div
							key={entry.id}
							className="flex items-center flex-wrap rounded border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)]"
						>
							<div className="px-2 flex items-center gap-3">
								<span className="text-sm">
									{getSemesterName(entry.semesterKey)}
								</span>
								<span className="text-[var(--semi-color-text-2)]">
									{entry.startDate}
								</span>
							</div>
							{canEdit && (
								<Button
									theme="borderless"
									type="danger"
									icon={<IconDelete />}
									onClick={() => handleRemoveEntry(entry.id)}
									className="ml-auto"
								>
									删除
								</Button>
							)}
						</div>
					))}
				</div>
			</Form.Slot>

			<Form.Slot label="调休信息">
				<div className="mt-2 text-xs text-[var(--semi-color-text-2)] mb-3">
					调课：将 from 那天的课全部改到 to 那天上，to 当天原课不上。停课：to
					那天直接放假。
				</div>
				<div className="space-y-1 mt-3 h-[360px] overflow-y-auto">
					{canEdit && (
						<div className="flex flex-col gap-2 p-3 rounded border border-dashed border-[var(--semi-color-border)]">
							<div className="flex items-center gap-2 flex-wrap">
								<Input
									placeholder="学年"
									value={addFlexXn}
									onChange={(v) => setAddFlexXn(String(v ?? ""))}
									style={{ width: 80 }}
								/>
								<Select
									placeholder="学期"
									value={addFlexXq}
									onChange={(v) => setAddFlexXq(String(v ?? ""))}
									optionList={SEMESTER_TYPE_OPTIONS}
									style={{ width: 110 }}
								/>
								<Input
									placeholder="描述，如 4.27补上5.5的课程"
									value={addFlexDesc}
									onChange={(v) => setAddFlexDesc(String(v ?? ""))}
									style={{ width: 200 }}
								/>
								<Select
									placeholder="类型"
									value={addFlexType}
									onChange={(v) => setAddFlexType(String(v ?? "move"))}
									optionList={FLEX_TYPE_OPTIONS}
									style={{ width: 80 }}
								/>
							</div>
							<div className="flex items-center gap-2 flex-wrap">
								{addFlexType === "move" && (
									<>
										<span className="text-[var(--semi-color-text-2)] text-sm">
											从
										</span>
										<Input
											placeholder="周"
											value={addFromWeek}
											onChange={(v) => setAddFromWeek(String(v ?? ""))}
											style={{ width: 56 }}
										/>
										<Select
											placeholder="星期"
											value={addFromDay}
											onChange={(v) => setAddFromDay(v as number)}
											optionList={WEEKDAY_OPTIONS}
											style={{ width: 80 }}
										/>
									</>
								)}
								<span className="text-[var(--semi-color-text-2)] text-sm">
									{addFlexType === "move" ? "->" : "停课"}
								</span>
								<Input
									placeholder="周"
									value={addToWeek}
									onChange={(v) => setAddToWeek(String(v ?? ""))}
									style={{ width: 56 }}
								/>
								<Select
									placeholder="星期"
									value={addToDay}
									onChange={(v) => setAddToDay(v as number)}
									optionList={WEEKDAY_OPTIONS}
									style={{ width: 80 }}
								/>
							</div>
							<div>
								<Button
									type="secondary"
									icon={<IconPlus />}
									onClick={handleAddFlexEntry}
									disabled={
										!addFlexDesc.trim() ||
										!addFlexXn.trim() ||
										!addFlexXq ||
										!addToWeek.trim() ||
										addToDay == null ||
										(addFlexType === "move" &&
											(!addFromWeek.trim() || addFromDay == null))
									}
								>
									添加
								</Button>
							</div>
						</div>
					)}
					{flexEntries.map((entry) => (
						<div
							key={entry.id}
							className="rounded border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)]"
						>
							<div className="flex">
								<div className="px-2 py-1.5 flex items-center gap-2 flex-wrap">
									<span className="text-sm font-medium">
										{getFlexSemesterName(entry.time.xn, entry.time.xq)}
									</span>
									<span className="text-[var(--semi-color-text-1)] text-sm">
										{entry.from
											? `${formatWeekDay(entry.from)} → ${formatWeekDay(entry.to)}`
											: `${formatWeekDay(entry.to)} 停课`}
									</span>
								</div>
								{canEdit && (
									<Button
										theme="borderless"
										type="danger"
										icon={<IconDelete />}
										onClick={() => handleRemoveFlexEntry(entry.id)}
										className="ml-auto"
									>
										删除
									</Button>
								)}
							</div>
							<Divider />
							<div className="text-[var(--semi-color-text-2)] text-sm p-2">
								{entry.desc}
							</div>
						</div>
					))}
				</div>
			</Form.Slot>

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
		</Form>
	);
}
