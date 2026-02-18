"use client";

import { Card, Empty, Typography, Row, Col, Tag } from "@douyinfe/semi-ui-19";
import { StatisticsResponseData } from "@/api/qnxg/statistics";
import {
	FeedbackStatusOptions,
	GoodsRecordStatusOptions,
	ZhihuPublishStatusOptions,
} from "@/config/fields";
import { useMemo } from "react";

const { Text } = Typography;

export interface HomeIndexPayload {
	data: StatisticsResponseData | null;
}

export default function HomeIndex({ payload }: { payload: HomeIndexPayload }) {
	const { data: rawData } = payload;

	const data = useMemo(() => {
		// 将 rawData 按 status 从小到大排序
		const data: StatisticsResponseData = {};
		Object.entries(rawData ?? {}).forEach(([key, items]) => {
			data[key] = items.sort((a, b) => a.status - b.status);
		});
		return data;
	}, [rawData]);

	const getStatusLabel = (type: string, status: number) => {
		let options;
		switch (type) {
			case "feedback":
				options = FeedbackStatusOptions;
				break;
			case "goods-record":
				options = GoodsRecordStatusOptions;
				break;
			case "zhihu":
				options = ZhihuPublishStatusOptions;
				break;
			default:
				return `状态 ${status}`;
		}
		const option = options.find((opt) => opt.value === status);
		return option ? option.label : `状态 ${status}`;
	};

	const getStatusColor = (type: string, status: number) => {
		let options;
		switch (type) {
			case "feedback":
				options = FeedbackStatusOptions;
				break;
			case "goods-record":
				options = GoodsRecordStatusOptions;
				break;
			case "zhihu":
				options = ZhihuPublishStatusOptions;
				break;
			default:
				return "grey";
		}
		const option = options.find((opt) => opt.value === status);
		return option?.color || "grey";
	};

	const getCategoryTitle = (type: string) => {
		switch (type) {
			case "feedback":
				return "问题反馈";
			case "goods-record":
				return "积分兑换";
			case "zhihu":
				return "知湖";
			default:
				return type;
		}
	};

	if (!data || Object.keys(data).length === 0) {
		return (
			<div className="p-6">
				<Empty description="暂无统计数据" />
			</div>
		);
	}

	return (
		<div className="max-w-screen overflow-hidden">
			<Row gutter={[8, 8]}>
				{Object.entries(data).map(([type, items]) => (
					<Col key={type} span={24} lg={8}>
						<Card
							title={
								<div className="flex justify-between items-center">
									<Text strong className="text-lg">
										{getCategoryTitle(type)}
									</Text>
								</div>
							}
							bordered
							className="h-full"
						>
							<div className="flex flex-col gap-3">
								{items.map((item) => (
									<div
										key={item.status}
										className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-md border border-gray-200"
									>
										<div className="flex items-center gap-2">
											<Tag color={getStatusColor(type, item.status)}>
												{getStatusLabel(type, item.status)}
											</Tag>
										</div>
										<Text
											strong
											className={`text-xl ${item.count > 0 ? "text-blue-500" : "text-gray-400"}`}
										>
											{item.count}
										</Text>
									</div>
								))}
							</div>
						</Card>
					</Col>
				))}
			</Row>
		</div>
	);
}
