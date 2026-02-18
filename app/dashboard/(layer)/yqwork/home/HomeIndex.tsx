"use client";

import { IUser } from "@/api/qnxg/user";
import { IWorkHours } from "@/api/qnxg/workHours";
import Logo from "@/app/icon.svg";
import Image from "next/image";
import { Badge } from "@douyinfe/semi-ui-19";
import dayjs from "dayjs";

interface HomeIndexPayload {
	userInfo: IUser;
	workHours?: IWorkHours[];
	todoFeedback?: number;
	todoGoodsRecord?: number;
	todoZhihu?: number;
	todoWorkHoursDept?: number;
}

export default function HomeIndex({
	userInfo,
	workHours,
	todoFeedback = 0,
	todoGoodsRecord = 0,
	todoZhihu = 0,
	todoWorkHoursDept = 0,
}: HomeIndexPayload) {
	return (
		<div className="space-y-4">
			<div className="rounded-2xl bg-opacity-[90] bg-primary">
				<div className="flex p-4 text-white rounded-2xl items-start w-full h-full">
					<div className="flex items-center flex-wrap">
						<div className="bg-white mr-4 p-4 rounded-2xl">
							<Image
								className="!w-[40px] !h-[40px]"
								src={Logo}
								alt="易千工作台"
							/>
						</div>
						<div className="text-2xl bold my-2">
							Hi，{userInfo.info.username ?? userInfo.info.name}{" "}
							欢迎使用易千工作台
						</div>
					</div>
				</div>
			</div>

			<div className="px-4 pb-4">
				{/* 待办事项 */}
				<div className="my-4">
					<div className="text-xl mb-4 flex items-center">
						<div>待处理事项</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-white rounded-lg border p-4">
							<div className="text-sm text-gray-500 mb-1">问题反馈</div>
							<div className="text-2xl font-bold">{todoFeedback}</div>
						</div>
						<div className="bg-white rounded-lg border p-4">
							<div className="text-sm text-gray-500 mb-1">积分兑换</div>
							<div className="text-2xl font-bold">{todoGoodsRecord}</div>
						</div>
						<div className="bg-white rounded-lg border p-4">
							<div className="text-sm text-gray-500 mb-1">知湖</div>
							<div className="text-2xl font-bold">{todoZhihu}</div>
						</div>
						<div className="bg-white rounded-lg border p-4">
							<div className="text-sm text-gray-500 mb-1">部门待审核工时</div>
							<div className="text-2xl font-bold">{todoWorkHoursDept}</div>
						</div>
					</div>
				</div>

				{/* 工时申报 */}
				{workHours && (
					<div className="my-4">
						<div className="text-xl mb-4 flex items-center">
							<div>工时申报</div>
						</div>
						{workHours.length > 0 ? (
							workHours.map((item) => {
								const { name, endTime } = item;
								return (
									<div
										key={`work-hour-${name}`}
										className="p-2 rounded mb-2 flex"
									>
										<Badge dot type="success" className="mr-2" />
										<div className="text-slate-800">
											{name} 正在进行中，截止时间为：
											{dayjs(endTime).format("YYYY-MM-DD HH:mm:ss")}
										</div>
									</div>
								);
							})
						) : (
							<div className="text-slate-800">暂无工时申报</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
