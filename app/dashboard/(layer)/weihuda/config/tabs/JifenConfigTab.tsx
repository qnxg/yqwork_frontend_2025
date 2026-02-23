"use client";

import { putMiniConfigByIdApi } from "@/api/weihuda/miniConfig";
import { withToast } from "@/utils/action";
import { Button, Form } from "@douyinfe/semi-ui-19";
import { IDomEditor } from "@wangeditor/editor";
import { Suspense, useRef, useState } from "react";
import { JIFEN_DESC_CONFIG_KEY } from "@/config";
import XRichText from "@/components/XRichText";

export interface JifenConfigTabProps {
	canEdit: boolean;
	jifenDesc: string;
}

export default function JifenConfigTab({
	canEdit,
	jifenDesc,
}: JifenConfigTabProps) {
	const editorRef = useRef<IDomEditor | null>(null);
	const [saving, setSaving] = useState(false);
	const handleSave = async () => {
		if (!editorRef.current) return;
		setSaving(true);
		try {
			await withToast(
				() =>
					putMiniConfigByIdApi(
						JIFEN_DESC_CONFIG_KEY,
						editorRef.current!.getHtml() || "",
					),
				"保存成功",
			);
		} catch {}
		setSaving(false);
	};
	return (
		<Form labelPosition="top" layout="vertical">
			<Form.Slot label="积分额外说明">
				<Suspense fallback={<div>加载中...</div>}>
					<XRichText
						className="mt-3"
						editorRef={editorRef}
						onLoaded={() => {
							setTimeout(() => {
								editorRef.current?.setHtml(jifenDesc);
							}, 300);
						}}
					/>
				</Suspense>
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
