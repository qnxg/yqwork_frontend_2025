import { IWorkHoursRecord } from "@/api/qnxg/workHoursRecord";
import { IOptionItem } from "@/config/fields";
import { Tag } from "@douyinfe/semi-ui-19";
import dayjs from "dayjs";
import { getTotalHours, getTotalSalary } from ".";

export const DateTimeRender = (endTime: string) =>
	dayjs(endTime).format("YYYY-MM-DD HH:mm");

export const StatusRender = (
	id: number,
	value: string | number,
	table: IOptionItem<string | number>[],
) => {
	const option = table.find((option) => option.value === value);
	return (
		<Tag key={id} color={option?.color}>
			{option?.label || "未知"}
		</Tag>
	);
};

export const OptionTextRender = (
	value: string | number,
	table: IOptionItem<string | number>[],
) => {
	const option = table.find((option) => option.value === value);
	return option?.label || "未知";
};

export const WorkDetailRender = (record: IWorkHoursRecord) => {
	return (
		<div className="p-4 bg-gray-50">
			<h4 className="font-bold mb-2">工作项目详情</h4>
			{record.workDescs.map((desc, idx) => (
				<div key={idx} className="mb-1 flex justify-between">
					<span>{desc.desc}</span>
					<span className="text-gray-600">{desc.hour}小时</span>
				</div>
			))}
			<div className="mt-2 pt-2 border-t border-gray-200 font-medium">
				<span>总计：{getTotalHours(record)}小时</span>
				<span className="ml-4">参考工资：{getTotalSalary(record)}元</span>
			</div>
		</div>
	);
};
