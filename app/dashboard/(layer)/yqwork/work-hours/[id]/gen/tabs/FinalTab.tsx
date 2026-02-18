"use client";

import { GenWorkHoursRecordPayload } from "../config";
import { Button, Tooltip, Table } from "@douyinfe/semi-ui-19";
import { useState, useEffect } from "react";
import { getTotalHours, sliceString } from "@/utils";
import { WAGE_PER_HOUR } from "@/config";
import { XueyuanOptions } from "@/config/fields";
import { exportToExcel } from "./export";

interface IRowSpanDataV {
	/**
	 * 开始位置
	 */
	start: number;
	/**
	 * 行合并长度
	 */
	len: number;
}

export interface IResultViewDataItem {
	id: number;
	index: number;
	name: string;
	xueyuan: string;
	stuId: string;
	department: string;
	departmentText: string;
	rowSpan: number;
	gangwei: string;
	workDescs: string;
	hour: number; // 工时：自己的
	totalHour: number; // 工时：自己的+包含的
	hourText: string;
	includes?: { id: number; name: string; department: string; hour: number }[];
	kaohe: string;
	wage: number; // 工资：自己的
	totalWage: number; // 工资：自己的+包含的
	comment: string;
}

const GenWorkHoursFinal = ({
	payload,
}: {
	payload: GenWorkHoursRecordPayload;
}) => {
	const { workHoursRecords: data, departmentList } = payload;

	// 要显示的数据
	const [showData, setShowData] = useState<IResultViewDataItem[]>([]);
	// 总结
	const [total, setTotal] = useState({
		kaohe0: 0,
		kaohe1: 0,
		wage: 0,
	});

	// 计算行合并数据
	useEffect(() => {
		// 筛选出在勤工助学岗位的数据
		const filteredData = data
			.filter((item) => item.userInfo.info.qingonggang && item.status > 2)
			.sort(
				(a, b) => a.userInfo.info.departmentId - b.userInfo.info.departmentId,
			);
		const showDataResult: IResultViewDataItem[] = [];
		const rowSpanDataResult: Record<string, IRowSpanDataV> = {};
		const totalResult = {
			kaohe0: 0,
			kaohe1: 0,
			wage: 0,
		};
		filteredData.forEach((item, i) => {
			let includeText = "";
			const includeHour = {
				hour: 0,
				text: "",
			};
			const includesArr = item.includes || [];
			const includes = includesArr.map((v) => {
				const item = data.find((item) => item.id === v.id)!;
				const name = item.userInfo.info.name;
				const department =
					departmentList.find((v) => v.id === item.userInfo.info.departmentId)
						?.name || "未知部门";
				includeText += `${name}${v.hour}+`;
				includeHour.hour += v.hour;
				if (!includeHour.text.includes(department)) {
					includeHour.text += `${department},`;
				}
				return {
					id: v.id,
					name,
					department,
					hour: v.hour,
				};
			});

			if (includeText !== "") {
				includeText = includeText.slice(0, -1);
				includeText = `含${includeText}`;
			}
			if (includeHour.text !== "") {
				includeHour.text = includeHour.text.slice(0, -1);
				includeHour.text = `${getTotalHours(item)}+${includeHour.hour}(含${includeHour.text})`;
			} else {
				includeHour.text = `${getTotalHours(item)}`;
			}
			const departmentName =
				departmentList.find((v) => v.id === item.userInfo.info.departmentId)
					?.name || "未知部门";
			const totalWage =
				(getTotalHours(item) + includeHour.hour) * WAGE_PER_HOUR;
			showDataResult.push({
				id: item.id,
				index: i + 1,
				name: item.userInfo.info.name,
				xueyuan:
					XueyuanOptions.find((v) => v.value === item.userInfo.info.xueyuan)
						?.label || "未知学院",
				stuId: item.userInfo.info.stuId,
				department:
					departmentList.find((v) => v.id === item.userInfo.info.departmentId)
						?.name || "未知部门",
				departmentText: "",
				rowSpan: 0,
				gangwei: item.userInfo.info.gangwei || "无",
				workDescs: item.workDescs
					.map((v, i2) => `${i2 + 1}.${v.desc} ${v.hour}`)
					.join("\n"),
				hour: getTotalHours(item), // 自己的
				totalHour: getTotalHours(item) + includeHour.hour, // 自己的+包含的
				hourText: includeHour.text, // 自己的+其他部门的(含什么什么部格式)
				includes,
				kaohe: "称职",
				wage: getTotalHours(item) * WAGE_PER_HOUR, // 自己的
				totalWage: totalWage, // 把包含项也加进去
				comment: includeText,
			});

			// 计算合并行
			if (!rowSpanDataResult[departmentName]) {
				rowSpanDataResult[departmentName] = {
					start: i,
					len: 1,
				};
			} else {
				rowSpanDataResult[departmentName].len++;
			}

			// 计算总结
			totalResult.kaohe0 += 1;
			totalResult.wage += totalWage;
		});
		// 重新计算department的rowSpan
		showDataResult.forEach((item, index) => {
			const departmentName = item.department;
			// 计算rowSpan
			const rowSpanItem = rowSpanDataResult[departmentName];
			if (rowSpanItem.start === index) {
				item.rowSpan = rowSpanItem.len;
				// 计算department的总工时和工资
				const thisDepartmentHour = {
					hour: 0,
					includes: [] as IResultViewDataItem["includes"],
				};
				for (let i = index; i < index + rowSpanItem.len; i++) {
					const it = showDataResult[i];
					thisDepartmentHour.hour += it.hour;
					if (it.includes) {
						// 如果包含了其他部门
						it.includes.forEach((v) => {
							const index = thisDepartmentHour.includes!.findIndex(
								(v2) => v2.name === v.name,
							);
							if (index === -1) {
								thisDepartmentHour.includes!.push(v);
							} else {
								thisDepartmentHour.includes![index].hour += v.hour;
							}
						});
					}
				}
				// 生成字符串
				let departmentText = "";
				if (
					thisDepartmentHour.includes &&
					thisDepartmentHour.includes.length > 0
				) {
					// 先按照部门名字合并
					const combinedIncludes: IResultViewDataItem["includes"] =
						thisDepartmentHour.includes.reduce(
							(acc, cur) => {
								if (cur.department === departmentName) {
									thisDepartmentHour.hour += cur.hour;
									return acc;
								}
								const index = acc!.findIndex(
									(v) => v.department === cur.department,
								);
								if (index === -1) {
									acc!.push({ ...cur });
								} else {
									acc![index].hour += cur.hour;
								}
								return acc;
							},
							[] as IResultViewDataItem["includes"],
						);

					departmentText = `${departmentName}(${thisDepartmentHour.hour * 15}`;
					if (combinedIncludes!.length > 0) {
						departmentText += "+";
					}
					departmentText += combinedIncludes!
						.map((v) => `${v.department}${v.hour * 15}`)
						.join("+");
					departmentText += ")";
				} else {
					departmentText = `${departmentName}(${thisDepartmentHour.hour * 15})`;
				}
				item.departmentText = departmentText;
			}
		});
		setTotal(totalResult);
		setShowData(showDataResult);
		console.log(showDataResult);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	// 导出
	const exportExcel = async () => {
		exportToExcel(showData);
	};
	return (
		<div>
			<div>
				<Button onClick={exportExcel}>导出</Button>
			</div>
			<div className="mb-2 text-center text-xl underline ">
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;部门&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;月勤工助学考核汇总表&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
			</div>
			<div className="flex justify-between px-2 text-sm">
				<div>部门（学院）签章：</div>
				<div>
					起止日期:&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日——&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日
				</div>
				<div>填报日期:&nbsp;&nbsp;年&nbsp;&nbsp;月&nbsp;&nbsp;日</div>
			</div>
			<Table
				bordered
				columns={[
					{
						title: "序号",
						dataIndex: "index",
					},
					{ title: "姓名", dataIndex: "name" },
					{
						title: "学院",
						dataIndex: "xueyuan",
						render: (text: string) => {
							if (!text) {
								return "";
							}
							return <Tooltip content={text}>{sliceString(text, 10)}</Tooltip>;
						},
					},
					{ title: "学号", dataIndex: "stuId" },
					{
						title: "工作单位",
						dataIndex: "departmentText",
						render: (text: string, record: IResultViewDataItem) => {
							return {
								children: text,
								props: {
									rowSpan: record.rowSpan,
								},
							};
						},
					},
					{
						title: "岗位",
						dataIndex: "gangwei",
					},
					{
						title: "本月开展的主要工作",
						dataIndex: "workDescs",
						render: (text: IResultViewDataItem["workDescs"]) => {
							return text.split("\n").map((item: string, i: number) => {
								return <p key={i + 1}>{item}</p>;
							});
						},
					},
					{
						title: "工作时数",
						dataIndex: "hourText",
					},
					{
						title: "考核结果",
						dataIndex: "kaohe",
					},
					{
						title: "建议发放工资",
						dataIndex: "totalWage",
						render: (text: IResultViewDataItem["totalWage"]) => {
							return text + ".0";
						},
					},
					{
						title: "备注",
						dataIndex: "comment",
					},
				]}
				dataSource={showData}
				pagination={false}
			/>
			<div className="mt-2">
				注：本月我院/部共有 {showData.length} 人在岗，{total.kaohe1}{" "}
				人考核优秀， {total.kaohe0} 人考核称职， 0 人考核基本称职， 0
				人考核不称职；应予发放勤工助学工资共 {total.wage} 元
			</div>
		</div>
	);
};

export default GenWorkHoursFinal;
