import { TagColor } from "@douyinfe/semi-ui-19/lib/es/tag";

export interface IOptionItem<T> {
	label: string;
	value: T;
	color?: TagColor;
}

export const XueyuanOptions: IOptionItem<number>[] = [
	{ label: "电气与信息工程学院", value: 1 },
	{ label: "法学院（纪检监察学院）", value: 2 },
	{ label: "工商管理学院", value: 3 },
	{ label: "化学化工学院", value: 4 },
	{ label: "环境科学与工程学院", value: 5 },
	{ label: "机械与运载工程学院", value: 6 },
	{ label: "建筑与规划学院", value: 7 },
	{ label: "金融与统计学院", value: 8 },
	{ label: "经济与贸易学院", value: 9 },
	{ label: "马克思主义学院", value: 10 },
	{ label: "设计艺术学院", value: 11 },
	{ label: "生物学院", value: 12 },
	{ label: "生命医学交叉研究院", value: 13 },
	{ label: "数学学院", value: 14 },
	{ label: "体育学院", value: 15 },
	{ label: "土木工程学院", value: 16 },
	{ label: "外国语学院", value: 17 },
	{ label: "物理与微电子科学学院", value: 18 },
	{ label: "新闻与传播学院", value: 19 },
	{
		label: "计算机学院",
		value: 20,
	},
	{ label: "岳麓书院", value: 21 },
	{ label: "中国语言文学学院", value: 22 },
	{ label: "卓越工程师学院", value: 23 },
	{ label: "机器人学院", value: 24 },
	{ label: "半导体学院（集成电路学院）", value: 25 },
	{ label: "公共管理学院", value: 26 },
	{ label: "材料科学与工程学院", value: 27 },
	{ label: "网络空间安全学院", value: 28 },
];

export const YesNoOptions: IOptionItem<boolean>[] = [
	{ label: "是", value: true },
	{ label: "否", value: false },
];

export const FeedbackStatusOptions: IOptionItem<number>[] = [
	{ color: "red", label: "待确认", value: 0 },
	{ color: "yellow", label: "已确认，等待处理", value: 1 },
	{ color: "blue", label: "正在处理", value: 2 },
	{ color: "green", label: "已处理并关闭", value: 3 },
];

export const GoodsRecordStatusOptions: IOptionItem<number>[] = [
	{ color: "red", label: "待后台确认", value: 0 },
	{ color: "yellow", label: "待收", value: 1 },
	{ color: "green", label: "已领取", value: 2 },
];

export const EnabledOptions: IOptionItem<boolean>[] = [
	{ color: "red", label: "禁用", value: false },
	{ color: "green", label: "启用", value: true },
];

export const NoticeStatusOptions: IOptionItem<number>[] = [
	{ color: "red", label: "未读", value: 0 },
	{ color: "green", label: "已读", value: 1 },
];

export const NoticeBindTypeOptions: IOptionItem<string>[] = [
	{ label: "问题反馈", value: "feedback" },
	{ label: "兑换奖品", value: "goodsRecord" },
	{ label: "留言信息", value: "messageleft" },
	{ label: "招新", value: "recruitment" },
	{ label: "工时申报", value: "workHours" },
];

export const ZhihuPublishStatusOptions: IOptionItem<number>[] = [
	{ color: "yellow", label: "待发布", value: 0 },
	{ color: "green", label: "已发布", value: 1 },
	{ color: "red", label: "拒绝发布", value: 2 },
];

export const ZhihuTypeOptions: IOptionItem<string>[] = [
	{ label: "文章", value: "article" },
	{ label: "链接", value: "link" },
];

export const UserStatusOptions: IOptionItem<number>[] = [
	{ color: "grey", label: "未知或待定", value: 0 },
	{ color: "blue", label: "实习", value: 1 },
	{ color: "green", label: "在岗", value: 2 },
	{ color: "white", label: "退离", value: 3 },
];

export const WorkHourStatusOptions: IOptionItem<number>[] = [
	{ color: "grey", label: "未开始", value: 0 },
	{ color: "light-green", label: "申报中", value: 1 },
	{ color: "red", label: "申报结束", value: 2 },
	{ color: "blue", label: "待发放", value: 3 },
	{ color: "teal", label: "已发放", value: 4 },
];

export const WorkHourRecordStatusOptions: IOptionItem<number>[] = [
	{ color: "grey", label: "未申报", value: 0 },
	{ color: "light-green", label: "部门负责人审核", value: 1 },
	{ color: "green", label: "财务部审核", value: 2 },
	{ color: "blue", label: "待发放", value: 3 },
	{ color: "teal", label: "已发放", value: 4 },
];
