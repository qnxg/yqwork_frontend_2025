"use client";

import { Button, Form, TagInput } from "@douyinfe/semi-ui-19";
import { useState } from "react";
import { putMiniConfigByIdApi } from "@/api/weihuda/miniConfig";
import { withToast } from "@/utils/action";
import { ZHIHU_TAGS_CONFIG_KEY } from "@/config";

function parseZhihuTags(value: string): string[] {
	try {
		const arr = JSON.parse(value || "[]") as { label: string; value: string }[];
		return arr.map((item) => item.label || item.value);
	} catch {
		return [];
	}
}

function toZhihuTagsJson(tagStrings: string[]): string {
	const arr = tagStrings.map((s) => ({ label: s, value: s }));
	return JSON.stringify(arr);
}

export interface ZhihuConfigTabProps {
	zhihuTagsStr: string;
	canEdit: boolean;
}

export default function ZhihuConfigTab({
	zhihuTagsStr,
	canEdit,
}: ZhihuConfigTabProps) {
	const [tagStrings, setTagStrings] = useState<string[]>(() =>
		parseZhihuTags(zhihuTagsStr),
	);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		try {
			await withToast(
				() =>
					putMiniConfigByIdApi(
						ZHIHU_TAGS_CONFIG_KEY,
						toZhihuTagsJson(tagStrings),
					),
				"保存成功",
			);
		} catch {}
		setSaving(false);
	};

	return (
		<Form labelPosition="top" layout="vertical">
			<Form.Slot label="知湖标签">
				<TagInput
					value={tagStrings}
					onChange={setTagStrings}
					showClear
					disabled={!canEdit}
					addOnBlur
					allowDuplicates={false}
					style={{ maxWidth: 560 }}
					className="mt-2"
				/>
				<div className="mt-2 text-xs text-[var(--semi-color-text-2)]">
					输入标签后，按回车添加
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
