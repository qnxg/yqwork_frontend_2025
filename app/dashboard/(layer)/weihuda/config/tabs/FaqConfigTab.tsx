"use client";

import { Button, Collapse, Input, Toast } from "@douyinfe/semi-ui-19";
import { IconDelete, IconPlus } from "@douyinfe/semi-icons";
import { useState } from "react";
import { putMiniConfigByIdApi } from "@/api/weihuda/miniConfig";
import { withToast } from "@/utils/action";
import { FAQ_CONFIG_KEY } from "@/config";

interface FaqItemRaw {
	q: string;
	a: string;
}

interface FaqCategoryRaw {
	title: string;
	items: FaqItemRaw[];
}

interface FaqItemWithId extends FaqItemRaw {
	id: string;
}

interface FaqCategoryWithId {
	id: string;
	title: string;
	items: FaqItemWithId[];
}

function parseFaq(value: string): FaqCategoryWithId[] {
	try {
		const arr = JSON.parse(value || "[]") as FaqCategoryRaw[];
		return arr.map((cat, ci) => ({
			id: `cat-${ci}-${cat.title}`,
			title: cat.title,
			items: (cat.items || []).map((item, ii) => ({
				id: `item-${ci}-${ii}`,
				q: item.q,
				a: item.a,
			})),
		}));
	} catch {
		return [];
	}
}

function toFaqJson(categories: FaqCategoryWithId[]): string {
	const arr: FaqCategoryRaw[] = categories.map((cat) => ({
		title: cat.title,
		items: cat.items.map(({ q, a }) => ({ q, a })),
	}));
	return JSON.stringify(arr);
}

export interface FaqConfigTabProps {
	faqStr: string;
	canEdit: boolean;
}

export default function FaqConfigTab({ faqStr, canEdit }: FaqConfigTabProps) {
	const [categories, setCategories] = useState<FaqCategoryWithId[]>(() =>
		parseFaq(faqStr),
	);
	const [saving, setSaving] = useState(false);

	// 新增分类
	const [newCategoryTitle, setNewCategoryTitle] = useState("");
	const handleAddCategory = () => {
		const title = newCategoryTitle.trim();
		if (!title) return;
		setCategories((prev) => [
			...prev,
			{
				id: `cat-${Date.now()}`,
				title,
				items: [],
			},
		]);
		setNewCategoryTitle("");
	};

	const handleRemoveCategory = (categoryId: string) => {
		setCategories((prev) => prev.filter((c) => c.id !== categoryId));
	};

	const handleUpdateCategoryTitle = (categoryId: string, title: string) => {
		setCategories((prev) =>
			prev.map((c) => (c.id === categoryId ? { ...c, title } : c)),
		);
	};

	// 某分类下新增 Q&A
	const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(
		null,
	);
	const [newQ, setNewQ] = useState("");
	const [newA, setNewA] = useState("");
	const handleAddItem = (categoryId: string) => {
		const q = newQ.trim();
		const a = newA.trim();
		if (!q || !a) return;
		setCategories((prev) =>
			prev.map((c) =>
				c.id === categoryId
					? {
							...c,
							items: [...c.items, { id: `item-${Date.now()}`, q, a }],
						}
					: c,
			),
		);
		setNewQ("");
		setNewA("");
		setAddingToCategoryId(null);
	};

	const handleRemoveItem = (categoryId: string, itemId: string) => {
		setCategories((prev) =>
			prev.map((c) =>
				c.id === categoryId
					? { ...c, items: c.items.filter((i) => i.id !== itemId) }
					: c,
			),
		);
	};

	// 编辑 Q&A（简单 inline：用 editingItemId 切到编辑态）
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [editQ, setEditQ] = useState("");
	const [editA, setEditA] = useState("");
	const startEdit = (item: FaqItemWithId) => {
		setEditingItemId(item.id);
		setEditQ(item.q);
		setEditA(item.a);
	};
	const handleSaveEdit = (categoryId: string) => {
		if (editingItemId == null) return;
		const q = editQ.trim();
		const a = editA.trim();
		if (!q || !a) {
			Toast.warning("问题和回答不能为空");
			return;
		}
		setCategories((prev) =>
			prev.map((c) =>
				c.id === categoryId
					? {
							...c,
							items: c.items.map((i) =>
								i.id === editingItemId ? { ...i, q, a } : i,
							),
						}
					: c,
			),
		);
		setEditingItemId(null);
		setEditQ("");
		setEditA("");
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await withToast(
				() => putMiniConfigByIdApi(FAQ_CONFIG_KEY, toFaqJson(categories)),
				"常见问题已保存",
			);
		} catch {}
		setSaving(false);
	};

	return (
		<div className="space-y-4">
			{canEdit && (
				<div className="flex flex-wrap items-center gap-2 p-3 rounded border border-dashed border-[var(--semi-color-border)]">
					<Input
						placeholder="新分类名称，如：登录相关"
						value={newCategoryTitle}
						onChange={(v) => setNewCategoryTitle(String(v ?? ""))}
						style={{ width: 220 }}
					/>
					<Button
						type="secondary"
						icon={<IconPlus />}
						onClick={handleAddCategory}
						disabled={!newCategoryTitle.trim()}
					>
						添加分类
					</Button>
				</div>
			)}

			<div className="space-y-2">
				<Collapse keepDOM>
					{categories.map((cat) => (
						<Collapse.Panel
							key={cat.id}
							itemKey={cat.id}
							header={
								<div className="flex items-center justify-between w-full pr-2">
									{canEdit ? (
										<span onClick={(e) => e.stopPropagation()}>
											<Input
												value={cat.title}
												onChange={(v) =>
													handleUpdateCategoryTitle(cat.id, String(v ?? ""))
												}
												style={{ width: 240 }}
												size="small"
											/>
										</span>
									) : (
										<span className="font-medium">{cat.title}</span>
									)}
									{canEdit && (
										<Button
											theme="borderless"
											type="danger"
											size="small"
											icon={<IconDelete />}
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveCategory(cat.id);
											}}
										>
											删除分类
										</Button>
									)}
								</div>
							}
						>
							<div
								className="p-3 pt-0 space-y-3"
								onClick={(e) => e.stopPropagation()}
							>
								{cat.items.map((item) => (
									<div
										key={item.id}
										className="rounded border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] p-3"
									>
										{editingItemId === item.id ? (
											<>
												<Input
													placeholder="问题"
													value={editQ}
													onChange={(v) => setEditQ(String(v ?? ""))}
													className="mb-2"
												/>
												<Input
													placeholder="回答"
													value={editA}
													onChange={(v) => setEditA(String(v ?? ""))}
													className="mb-2"
												/>
												<div className="flex gap-2">
													<Button
														size="small"
														onClick={() => handleSaveEdit(cat.id)}
													>
														保存
													</Button>
													<Button
														size="small"
														theme="borderless"
														onClick={() => {
															setEditingItemId(null);
															setEditQ("");
															setEditA("");
														}}
													>
														取消
													</Button>
												</div>
											</>
										) : (
											<>
												<div className="font-medium text-sm text-[var(--semi-color-text-0)]">
													Q: {item.q}
												</div>
												<div className="text-sm text-[var(--semi-color-text-2)] mt-1">
													A: {item.a}
												</div>
												{canEdit && (
													<div className="flex gap-2 mt-2">
														<Button
															size="small"
															theme="borderless"
															onClick={() => startEdit(item)}
														>
															编辑
														</Button>
														<Button
															size="small"
															theme="borderless"
															type="danger"
															icon={<IconDelete />}
															onClick={() => handleRemoveItem(cat.id, item.id)}
														>
															删除
														</Button>
													</div>
												)}
											</>
										)}
									</div>
								))}

								{canEdit && (
									<>
										{addingToCategoryId === cat.id ? (
											<div className="rounded border border-dashed p-3 space-y-2">
												<Input
													placeholder="问题"
													value={newQ}
													onChange={(v) => setNewQ(String(v ?? ""))}
												/>
												<Input
													placeholder="回答"
													value={newA}
													onChange={(v) => setNewA(String(v ?? ""))}
												/>
												<div className="flex gap-2">
													<Button
														size="small"
														onClick={() => handleAddItem(cat.id)}
														disabled={!newQ.trim() || !newA.trim()}
													>
														添加
													</Button>
													<Button
														size="small"
														theme="borderless"
														onClick={() => {
															setAddingToCategoryId(null);
															setNewQ("");
															setNewA("");
														}}
													>
														取消
													</Button>
												</div>
											</div>
										) : (
											<Button
												type="secondary"
												size="small"
												icon={<IconPlus />}
												onClick={() => setAddingToCategoryId(cat.id)}
											>
												添加问答
											</Button>
										)}
									</>
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
