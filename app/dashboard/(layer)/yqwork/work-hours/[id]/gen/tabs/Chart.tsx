import { IWorkHoursStatistics } from "@/api/qnxg/workHours";
import { WAGE_PER_HOUR } from "@/config";
import { Axis, Bar, BarChart } from "@visactor/react-vchart";
import React, { memo, useMemo } from "react";

export interface IChartProps {
	stats: IWorkHoursStatistics[];
}

interface DataItem {
	department: string;
	wage: number;
	hour: number;
	count: number;
}

const Chart: React.FC<IChartProps> = ({ stats }) => {
	const data = useMemo(() => {
		const data: DataItem[] = stats.map((item) => ({
			department: item.department.name,
			wage: item.stats.totalHours * WAGE_PER_HOUR,
			hour: item.stats.totalHours,
			count: item.stats.count,
		}));
		return data;
	}, [stats]);
	return (
		<BarChart
			data={[{ id: "stats", values: data }]}
			type="bar"
			yField="wage"
			xField="department"
			seriesField="department"
			height={300}
		>
			<Bar
				barMaxWidth={30}
				label={{
					visible: true,
					position: "inside",
					style: {
						fontSize: 10,
					},
				}}
				tooltip={{
					mark: {
						content: [
							{
								key: () => "工资",
								value: (d) => d?.wage,
							},
							{
								key: () => "工时",
								value: (d) => d?.hour,
								hasShape: false,
							},
							{
								key: () => "人数",
								value: (d) => d?.count,
								hasShape: false,
							},
						],
					},
					dimension: {
						content: [
							{
								key: () => "工资",
								value: (d) => d?.wage,
							},
							{
								key: () => "工时",
								value: (d) => d?.hour,
								hasShape: false,
							},
							{
								key: () => "人数",
								value: (d) => d?.count,
								hasShape: false,
							},
						],
					},
				}}
			/>
			<Axis
				orient="bottom"
				type="band"
				sampling={false}
				label={{
					autoRotate: true,
					style: {
						textAlign: "end",
					},
				}}
			/>
			<Axis orient="left" type="linear" />
		</BarChart>
	);
};

export default memo(Chart);
