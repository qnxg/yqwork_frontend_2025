"use client";

import { Button, Card, InputNumber, Space } from "@douyinfe/semi-ui-19";
import { GenWorkHoursRecordPayload } from "../config";
import { IconUndo, IconPlay, IconSave } from "@douyinfe/semi-icons";
import {
	IWorkHoursRecord,
	IWorkHoursTableItem,
	putWorkHoursRecordSaveApi,
} from "@/api/qnxg/workHoursRecord";
import { cloneDeep } from "@douyinfe/semi-ui-19/lib/es/_utils";
import classNames from "classnames";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDrag, useDrop } from "ahooks";
import { WAGE_PER_HOUR, WORK_HOUR_LIMIT } from "@/config";
import { getTotalHours } from "@/utils";
import { IDepartment } from "@/api/qnxg/department";
import { withToast } from "@/utils/action";

/**
 * 展示的数据
 */
interface IDataItem {
	id: number;
	name: string;
	department: number;
	hour: number;
	// 父记录
	parents?: IDataItem[];
	// 是否是包含区域中的数据
	includeArea?: boolean;
}

interface IDataItemProps {
	// 展示的数据
	data: IDataItem;
	// 删除时的回调
	onDelete?: (data: IDataItem) => void;
	// 数据变化时的回调
	onHourChange?: (newHour: number) => void;
	departmentList: IDepartment[];
}

/**
 * 数据条目
 */
const DataItem: React.FC<IDataItemProps> = ({
	data,
	onDelete,
	onHourChange,
	departmentList,
}) => {
	const { name, department, hour, parents, includeArea } = data;
	const departmentName =
		departmentList.find((v) => v.id === department)?.name || "未知部门";
	const dragRef = useRef(null);
	useDrag(data, dragRef, {
		onDragStart: () => {
			// 取消header的鼠标事件，以便拖拽到顶部时让页面滚动
			document
				.querySelector(".header")
				?.setAttribute("style", "pointer-events: none;");
		},
		onDragEnd: () => {
			document.querySelector(".header")?.removeAttribute("style");
		},
	});
	return (
		<div
			className={classNames(
				`m-2 p-2 w-[250px]  rounded 
            flex flex-col flex-shrink-0
            bg-white
            border border-solid border-gray-300`,
				{ "cursor-move": hour > 0 },
			)}
			ref={dragRef}
		>
			<div className="flex justify-between">
				<div>
					<div>{name}</div>
					<div>{departmentName}</div>
					<div></div>
					{parents && parents.length > 0 && (
						<div className="text-sm text-gray-500">
							发放给：
							{parents.map((v) => `${v.name} ${v.hour}`).join(" + ")}
						</div>
					)}
				</div>
				<div className="w-[80px]">
					{/* 可编辑时显示数字输入框 */}
					{includeArea ? (
						<InputNumber value={hour} onNumberChange={onHourChange} min={1} />
					) : (
						<div>{hour} h</div>
					)}

					<div>{hour * WAGE_PER_HOUR}</div>
				</div>
			</div>
			{onDelete && (
				<Button
					className="self-end mt-2"
					size="small"
					type="tertiary"
					theme="borderless"
					onClick={() => {
						onDelete(data);
					}}
				>
					取消
				</Button>
			)}
		</div>
	);
};

// 获取本条记录被包含的记录
const getParentDataItems = (dataItemId: number, data: IWorkHoursRecord[]) => {
	const result = [];
	let totalHour = 0;
	for (const item of data) {
		const includes = item.includes;
		if (!includes) continue;
		// 遍历父记录的includes，找到本条记录
		for (const includeItem of includes) {
			if (includeItem.id === dataItemId) {
				const { hour } = includeItem;
				const user = item.userInfo;
				result.push({
					id: item.id, // 父记录id
					name: user.info.name, // 父记录姓名
					department: user.info.departmentId, // 父记录部门
					hour, // 本条记录包含的工时
				});
				totalHour += hour;
			}
		}
	}
	return { totalHour, result };
};

// 开始制作工资表
const startMake = (data: IWorkHoursRecord[]) => {
	// 把数据克隆一份
	const clonedData = cloneDeep(data);
	// 将 id 的部分工时发放给 j
	const addIncludeItemForItemJ = (j: number, id: number, hour: number) => {
		const current = clonedData[j];
		const includes = current.includes || [];
		const newIncludes = [...includes, { id, hour }];
		clonedData[j] = {
			...current,
			includes: newIncludes,
		};
	};
	// 第一步：把不在勤工岗的工时尽可能的发放给本部门的其他人
	// 第一次分配的时候，不拆分工时，也就是把自己的所有工资全发给一个人
	// 第二次分配的时候，可以拆分工时
	const stepOne = (time: 0 | 1 = 0) => {
		// 当前部门
		const currentDepartment = {
			id: -1,
			startIndex: 0,
		};
		for (let i = 0; i < clonedData.length; i++) {
			const item = clonedData[i]; // 把item发放给current
			// 更新当前部门，在制作工资表之前，工资表已经按照部门排序，因此这里是一段一段分割的逻辑
			if (item.userInfo.info.departmentId !== currentDepartment.id) {
				currentDepartment.id = item.userInfo.info.departmentId;
				currentDepartment.startIndex = i;
			}
			// 在勤工岗且工时没有超过 40 的话就不用分配
			if (
				item.userInfo.info.qingonggang &&
				getTotalHours(item) <= WORK_HOUR_LIMIT
			)
				continue;
			const { totalHour: itemParentTotal } = getParentDataItems(
				item.id,
				clonedData,
			);
			// 计算剩余要分配的工时
			let itemLeftHour =
				getTotalHours(item) -
				itemParentTotal -
				(item.userInfo.info.qingonggang ? WORK_HOUR_LIMIT : 0);
			// 如果已经分配完了，就不用再分配了
			if (itemLeftHour === 0) continue;
			// 从当前部门的第一个人开始往后遍历，尝试去发放工时
			for (let j = currentDepartment.startIndex; j < clonedData.length; j++) {
				const current = clonedData[j];
				// 不等于的话说明已经遍历到了下一个部门，跳出循环
				if (current.userInfo.info.departmentId !== currentDepartment.id) break;
				// 本人、不在勤工岗、工时超过40、没超过40但是没有剩余容量的跳过
				if (j === i || !current.userInfo.info.qingonggang) continue;
				const currentTotal =
					getTotalHours(current) +
					(current.includes || []).reduce((sum, item) => sum + item.hour, 0);
				if (currentTotal >= WORK_HOUR_LIMIT) continue;
				// 如果相加后总工时不超过40，可以直接发
				if (currentTotal + itemLeftHour <= 40) {
					addIncludeItemForItemJ(j, item.id, itemLeftHour);
					break;
				} else if (time === 1) {
					const newHour = 40 - currentTotal;
					addIncludeItemForItemJ(j, item.id, newHour);
					itemLeftHour -= newHour;
					// 不能直接发的话，说明发完还有剩余，因此这里也不用判断是否还需要继续发放
				}
			}
		}
	};

	// 第二步：仍然存在没有被分配的不在岗工时，把它们分配给其他部门的人
	// time: 0表示第一次分配，1表示第二次分配
	// 第一次分配的时候，尽量不要拆分工时
	// 第二次分配的时候，可以拆分工时
	const stepTwo = (time: 0 | 1 = 0) => {
		// 上一次分配满的j项
		let lastJ = -1;
		for (let i = 0; i < clonedData.length; i++) {
			const item = clonedData[i];
			// 不在勤工岗或者工时没有超过40的话就不用分配
			if (
				item.userInfo.info.qingonggang &&
				getTotalHours(item) <= WORK_HOUR_LIMIT
			)
				continue;
			const { totalHour: itemParentTotal } = getParentDataItems(
				item.id,
				clonedData,
			);
			// 计算剩余要分配的工时
			let itemLeftHour =
				getTotalHours(item) -
				itemParentTotal -
				(item.userInfo.info.qingonggang ? WORK_HOUR_LIMIT : 0);
			// 如果剩余工时为0，不分配
			if (itemLeftHour === 0) continue;
			// 开始分配给其他部门
			for (let j = lastJ + 1; j < clonedData.length; j++) {
				const current = clonedData[j];
				// 本人、总工时超过40的跳过
				if (j === i || !current.userInfo.info.qingonggang) continue;
				const currentTotal =
					getTotalHours(current) +
					(current.includes || []).reduce((sum, item) => sum + item.hour, 0);
				if (currentTotal >= WORK_HOUR_LIMIT) continue;

				// 如果相加后总工时不超过40，就可以发放
				if (currentTotal + itemLeftHour <= 40) {
					addIncludeItemForItemJ(j, item.id, itemLeftHour);
					// 刚好满40更新lastJ
					if (currentTotal + itemLeftHour === 40) lastJ = j;
					break;
				} else if (time === 1) {
					// 如果超过40，就把剩余的工时发放给下一个人
					const newHour = 40 - currentTotal;
					lastJ = j;
					addIncludeItemForItemJ(j, item.id, newHour);
					itemLeftHour -= newHour;
				}
			}
		}
	};

	stepOne();

	stepOne(1);

	stepTwo();

	stepTwo(1);

	return clonedData;
};

const GenWorkHoursTable = ({
	payload,
}: {
	payload: GenWorkHoursRecordPayload;
}) => {
	const router = useRouter();
	const { workHoursRecords: propsData, departmentList } = payload;
	// 初始数据
	const [initialData, setInitialData] = useState<IWorkHoursRecord[]>([]);
	// 操作的数据
	const [data, setData] = useState<IWorkHoursRecord[]>([]);
	const [loading, setLoading] = useState("");

	// 初始化数据
	useEffect(() => {
		if (!propsData || propsData.length === 0) return;
		const result = cloneDeep(propsData)
			.filter((v) => v.status > 2)
			.sort(
				(a, b) => a.userInfo.info.departmentId - b.userInfo.info.departmentId,
			);
		setInitialData(result);
		setData(result);
	}, [propsData]);

	// 获取本条记录包含的记录
	const getIncludedDataItems = (dataItem: IWorkHoursRecord) => {
		const includes = dataItem.includes;
		if (!includes) return [];
		const result: IDataItem[] = [];
		for (const item of includes) {
			const { id, hour } = item;
			const record = data.find((v) => v.id === id);
			if (record) {
				const user = record.userInfo.info;
				result.push({
					id: item.id,
					name: user.name,
					department: user.departmentId,
					hour,
				});
			}
		}
		return result;
	};

	// 让某一条包含另一条
	const include = (includeItem: IDataItem, parent: IWorkHoursRecord) => {
		// 如果包含的数据没有工时，不允许包含
		// 自己不能包含自己
		if (includeItem.hour <= 0 || includeItem.id === parent.id) return;

		// 不能重复包含
		if (parent.includes && parent.includes.find((v) => v.id === includeItem.id))
			return;

		// 更新父记录的includes，加入新的包含
		const includes = parent.includes || [];
		const newIncludes = [
			...includes,
			{ id: includeItem.id, hour: includeItem.hour },
		];
		const newData = data.map((v) => {
			// 更新父记录的includes
			if (v.id === parent.id) {
				return {
					...v,
					includes: newIncludes,
				};
			}
			// 如果该数据是从包含区域拖拽过来的，需要删除原来的数据
			// 删除原来的数据
			if (
				includeItem.includeArea &&
				v.includes &&
				v.includes.some(
					(v) => v.id === includeItem.id && v.hour === includeItem.hour,
				)
			) {
				return {
					...v,
					includes: v.includes.filter((v) => v.id !== includeItem.id),
				};
			}
			return v;
		});

		setData(newData);
	};

	// 取消包含
	const unInclude = (includeItem: IDataItem, parent: IWorkHoursRecord) => {
		const includes = parent.includes || [];
		const newIncludes = includes.filter((v) => v.id !== includeItem.id);
		const newData = data.map((v) => {
			if (v.id === parent.id) {
				return { ...v, includes: newIncludes };
			}
			return v;
		});
		setData(newData);
	};

	// 被包含的数据变化时
	const onIncludeChange = (
		includeItem: IDataItem,
		parent: IWorkHoursRecord,
		newHour: number,
	) => {
		const includes = parent.includes || [];
		const newIncludes = includes.map((v) => {
			if (v.id === includeItem.id) {
				return { ...v, hour: newHour };
			}
			return v;
		});
		const newData = data.map((v) => {
			if (v.id === parent.id) {
				return { ...v, includes: newIncludes };
			}
			return v;
		});
		setData(newData);
	};

	// 重置
	const reset = () => {
		setData(cloneDeep(initialData));
	};

	// 一行数据展示组件
	const DataRow = (props: { item: IWorkHoursRecord; index: number }) => {
		const { item, index } = props;
		// 拖拽相关
		const [isHovering, setIsHovering] = useState(false);
		const dropRef = useRef(null);
		useDrop(dropRef, {
			onDom: (content: IDataItem) => {
				include(content, item);
				setIsHovering(false);
			},
			onDragEnter: () => setIsHovering(true),
			onDragLeave: () => setIsHovering(false),
		});
		// 本记录的总工时和总工资
		const itemTotal = getTotalHours(item);
		// 父记录，父记录的总工时和总工资
		const { totalHour: parentTotal, result: parents } = getParentDataItems(
			item.id,
			data,
		);

		// 如果总工时为0，不显示
		if (itemTotal - parentTotal === 0) return null;

		// 本条记录包含的记录
		const includedDataItems = getIncludedDataItems(item);
		// 被包含记录的总工时和总工资
		const includedTotal = includedDataItems.reduce(
			(sum, item) => sum + item.hour,
			0,
		);
		// 本条记录实际应发的工时和工资
		const realTotal = {
			// 本条记录的总工时 - 被分配给别人的工时 + 被别人分配的工时
			hour: itemTotal - parentTotal + includedTotal,
			wage: (itemTotal - parentTotal + includedTotal) * 15,
		};

		return (
			// 一条记录
			<div
				key={index}
				className={classNames("my-2 rounded flex bg-gray-100", {
					"bg-yellow-100": !item.userInfo.info.qingonggang,
				})}
			>
				{/* 本人信息 */}
				<div className="mr-16">
					<DataItem
						key={index}
						data={{
							id: item.id,
							name: item.userInfo.info.name,
							department: item.userInfo.info.departmentId,
							hour: itemTotal - parentTotal,
							parents,
						}}
						departmentList={departmentList}
					/>
				</div>

				{/* 包含，从data中筛选出to中的id后渲染 */}
				<div
					ref={dropRef}
					className={classNames(
						`mr-16 bg-gray-200
                        flex flex-wrap
                        min-w-[270px] max-w-[600px]`,
						{ "bg-gray-300": isHovering },
					)}
				>
					{includedDataItems.map((v, i) => {
						// 给v打tag，标记为包含区域中的数据'
						v.includeArea = true;
						return (
							<DataItem
								key={i}
								data={v}
								onDelete={(data: IDataItem) => unInclude(data, item)}
								onHourChange={(newHour) => onIncludeChange(v, item, newHour)}
								departmentList={departmentList}
							/>
						);
					})}

					<div
						className={classNames(
							"my-2 border-2 border-solid border-blue-500 w-full",
							{
								hidden: !isHovering,
							},
						)}
					></div>
				</div>

				{/* 总工时 */}
				<div
					className={classNames("mr-16 w-[100px] self-center text-xl", {
						"text-red-500": realTotal.hour > 40,
					})}
				>
					{realTotal.hour}
				</div>

				{/* 总工资 */}
				<div
					className={classNames("mr-16 self-center text-xl", {
						"text-red-500": realTotal.wage > 600,
					})}
				>
					{realTotal.wage} 元
				</div>
			</div>
		);
	};

	// 保存
	const handleSave = async () => {
		const result: IWorkHoursTableItem[] = data.map((v) => {
			return {
				id: v.id,
				includes: v.includes || [],
			};
		});
		setLoading("save");
		try {
			await withToast(
				() => putWorkHoursRecordSaveApi({ data: result }),
				"保存成功",
			);
			router.refresh();
		} catch {}
		setLoading("");
	};
	return (
		<>
			<Card title="说明">
				<div className="text-gray-700">
					<div className="mb-2">注：财务部审核通过的数据才会显示在这里</div>
					<div className="mb-2">
						1. 所有数据收集完成后，点击下方的自动处理按钮尝试自动制作工资表。
					</div>
					<div className="mb-2">
						(自动制作规则：将未在勤工岗的工时分配到在勤工岗的申请中，并保证每条申请不超过600元)
					</div>
					<div className="mb-2">
						2. 自动处理后，核对自动处理后的结果是否符合预期。
					</div>
					<div className="mb-2">
						3. 若不符合预期可以手动调整（按住拖拽到想要的位置）。
					</div>
					<div className="mb-2">4. 完成后点击保存按钮。</div>
					<div className="mb-2">5. 到结果视图中查看最终工资表。</div>
				</div>
			</Card>
			<div className="mt-4">
				<Space>
					<Button onClick={reset} icon={<IconUndo />}>
						重置
					</Button>
					<Button
						onClick={() => {
							setData(startMake(data));
						}}
						icon={<IconPlay />}
						disabled={loading !== ""}
					>
						尝试自动处理
					</Button>
					<Button
						onClick={() => {
							handleSave();
						}}
						icon={<IconSave />}
						loading={loading === "save"}
						disabled={loading !== ""}
					>
						保存
					</Button>
				</Space>
			</div>
			<div className="w-full overflow-x-auto mt-4">
				<div className="flex flex-col">
					<div className="mb-2 p-2 rounded flex">
						<div className="mr-16 w-[250px] flex-shrink-0">本人信息</div>
						<div className="mr-16 w-[300px] flex-shrink-0">包含</div>
						<div className="mr-16 w-[100px] flex-shrink-0">总工时</div>
						<div className="mr-16 w-[100px] flex-shrink-0">总工资</div>
					</div>

					{data.map((item, index) => {
						return <DataRow key={index} item={item} index={index} />;
					})}
				</div>
			</div>
		</>
	);
};

export default GenWorkHoursTable;
