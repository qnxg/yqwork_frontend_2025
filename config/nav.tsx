import Icon, {
	IconApps,
	IconArticle,
	IconBox,
	IconClock,
	IconComment,
	IconHistogram,
	IconHome,
	IconKeyStroked,
	IconMail,
	IconSetting,
	IconShield,
	IconShoppingBag,
	IconUserGroup,
	IconUserSetting,
} from "@douyinfe/semi-icons";
import IconWeihuda from "@/app/wsh.png";
import Image from "next/image";
import { JSX } from "react";
import { genRouteTable } from "@/utils";

export interface NavItem {
	itemKey: string;
	text: string;
	link: string;
	icon: JSX.Element;
	largeIcon: JSX.Element;
}

export const NavAppList: NavItem[] = [
	{
		itemKey: "yqwork",
		text: "易千工作台",
		link: "/dashboard/yqwork",
		icon: <IconBox className="text-primary" />,
		largeIcon: <IconBox className="text-primary" size="extra-large" />,
	},
	{
		itemKey: "weihuda",
		text: "湖大微生活",
		link: "/dashboard/weihuda",
		icon: (
			<Icon
				svg={
					<Image src={IconWeihuda} width="20" height="20" alt={"湖大微生活"} />
				}
			/>
		),
		largeIcon: (
			<Icon
				svg={
					<Image src={IconWeihuda} width="24" height="24" alt={"湖大微生活"} />
				}
			/>
		),
	},
];

export const NavYQWorkList: NavItem[] = [
	{
		itemKey: "home",
		text: "首页",
		icon: <IconHome />,
		largeIcon: <IconHome size="large" />,
		link: "/dashboard/yqwork/home",
	},
	{
		itemKey: "department",
		text: "部门管理",
		icon: <IconApps />,
		largeIcon: <IconApps size="large" />,
		link: "/dashboard/yqwork/department",
	},
	{
		itemKey: "work-hours",
		text: "工时申报",
		icon: <IconClock />,
		largeIcon: <IconClock size="large" />,
		link: "/dashboard/yqwork/work-hours",
	},
	{
		itemKey: "user",
		text: "用户管理",
		icon: <IconUserGroup />,
		largeIcon: <IconUserGroup size="large" />,
		link: "/dashboard/yqwork/user",
	},
	{
		itemKey: "permission",
		text: "权限管理",
		icon: <IconKeyStroked />,
		largeIcon: <IconKeyStroked size="large" />,
		link: "/dashboard/yqwork/permission",
	},
	{
		itemKey: "role",
		text: "角色管理",
		icon: <IconShield />,
		largeIcon: <IconShield size="large" />,
		link: "/dashboard/yqwork/role",
	},
];

export const NavWeihudaList: NavItem[] = [
	{
		itemKey: "home",
		text: "统计",
		icon: <IconHistogram />,
		largeIcon: <IconHistogram size="large" />,
		link: "/dashboard/weihuda/home",
	},
	{
		itemKey: "announcement",
		text: "公告",
		icon: <IconMail />,
		largeIcon: <IconMail size="large" />,
		link: "/dashboard/weihuda/announcement",
	},
	{
		itemKey: "feedback",
		text: "问题反馈",
		icon: <IconComment />,
		largeIcon: <IconComment size="large" />,
		link: "/dashboard/weihuda/feedback",
	},
	{
		itemKey: "config",
		text: "小程序配置",
		icon: <IconSetting />,
		largeIcon: <IconSetting size="large" />,
		link: "/dashboard/weihuda/config",
	},
	{
		itemKey: "zhihu",
		text: "知湖文章",
		icon: <IconArticle />,
		largeIcon: <IconArticle size="large" />,
		link: "/dashboard/weihuda/zhihu",
	},
	{
		itemKey: "jifen",
		text: "积分中心",
		icon: <IconShoppingBag />,
		largeIcon: <IconShoppingBag size="large" />,
		link: "/dashboard/weihuda/jifen",
	},
];

/**
 * 导航路由表项
 * 主要用户导航条上的标题显示
 */
export interface RouteTableItem {
	title: string;
	icon: JSX.Element;
	url: string;
}

// 按 url 长度从大到小排
export const RouteTable: RouteTableItem[] = [
	...genRouteTable(NavYQWorkList),
	...genRouteTable(NavWeihudaList),
	{
		title: "个人信息",
		icon: <IconUserSetting size="large" />,
		url: "/dashboard/yqwork/profile",
	},
].sort((a, b) => b.url.length - a.url.length);
