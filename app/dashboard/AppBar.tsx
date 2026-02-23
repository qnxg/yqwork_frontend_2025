"use client";

import Image from "next/image";
import Logo from "@/app/icon.svg";
import { Avatar, Button, Divider, Dropdown, Nav } from "@douyinfe/semi-ui-19";
import {
	NavAppList,
	NavWeihudaList,
	NavYQWorkList,
	RouteTable,
} from "@/config/nav";
import {
	IconArrowLeft,
	IconArrowRight,
	IconExit,
	IconMenu,
	IconUserSetting,
} from "@douyinfe/semi-icons";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMemo, useState } from "react";
import { ItemKey, NavItems } from "@douyinfe/semi-ui-19/lib/es/navigation";
import { IUser } from "@/api/qnxg/user";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logout } from "@/utils/auth";
import {
	useRefreshOnPathnameChange,
	useRefreshOnSearchParamsChange,
} from "@/utils/hooks";

function MobileSubMenu({
	subMenu,
	onBack,
	nav,
	onNavClick,
}: {
	subMenu: string;
	onBack: () => void;
	nav: string | null;
	onNavClick: (data: { itemKey?: ItemKey; domEvent?: MouseEvent }) => void;
}) {
	const [item, menu] = useMemo(() => {
		const item = NavAppList.find((i) => i.itemKey === subMenu)!;
		let menu: NavItems = [];
		if (item.itemKey === "yqwork") {
			menu = NavYQWorkList;
		} else if (item.itemKey === "weihuda") {
			menu = NavWeihudaList;
		}
		return [item, menu];
	}, [subMenu]);
	return (
		<>
			<div className="mx-2 mt-2 flex items-center">
				<Button
					icon={<IconArrowLeft />}
					aria-label="返回"
					theme="borderless"
					className="mr-2"
					onClick={onBack}
				/>
				{item.largeIcon}
				<div className="text-primary font-bold ml-2">{item.text}</div>
			</div>
			<Nav
				className="bg-background w-full"
				items={menu}
				selectedKeys={[nav]}
				onClick={onNavClick}
			/>
		</>
	);
}

function UserCard({
	payload,
	onCloseNav,
}: {
	payload: AppBarPayload;
	onCloseNav?: () => void;
}) {
	const router = useRouter();
	return (
		<>
			<div className="mx-4 mt-4 mb-2 flex items-center">
				<Avatar color="light-blue" alt="Taylor Joy">
					{payload.user.info.name.slice(-1, payload.user.info.name.length)}
				</Avatar>
				<div className="ml-4">
					<div className="text-lg">{payload.user.info.name}</div>
					<div className="text-xs">{payload.department}</div>
				</div>
			</div>
			<Dropdown.Menu className="mx-2">
				<Dropdown.Item
					icon={<IconUserSetting />}
					onClick={() => {
						router.push("/dashboard/yqwork/profile", { scroll: false });
						onCloseNav?.();
					}}
				>
					个人信息
				</Dropdown.Item>
				<Dropdown.Item
					icon={<IconExit />}
					onClick={() => {
						logout(router);
						onCloseNav?.();
					}}
				>
					退出登录
				</Dropdown.Item>
			</Dropdown.Menu>
		</>
	);
}

export interface AppBarPayload {
	user: IUser;
	department: string;
}

export default function AppBar({
	children,
	payload,
}: Readonly<{
	children: React.ReactNode;
	payload: AppBarPayload;
}>) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	// 确保所有页面都可以在 pathname 和 searchParams 变化时，重新拉取数据。
	useRefreshOnSearchParamsChange(searchParams);
	useRefreshOnPathnameChange(pathname);
	const router = useRouter();

	const handleNavClick =
		(items: { itemKey: ItemKey; link?: string }[]) =>
		(data: { itemKey?: ItemKey; domEvent?: MouseEvent }) => {
			console.log(items);
			console.log(data);
			const item = items.find((i) => i.itemKey === data.itemKey);
			if (item?.link) {
				data.domEvent?.preventDefault?.();
				router.push(item.link, { scroll: false });
			}
		};

	const [appItem, navList, navItem] = useMemo(() => {
		const appItem =
			NavAppList.find((app) => pathname.startsWith(app.link)) ?? null;
		let navItem = null;
		let navList = null;
		if (appItem) {
			let next = null;
			if (appItem.itemKey === "yqwork") next = NavYQWorkList;
			else if (appItem.itemKey === "weihuda") next = NavWeihudaList;
			if (next) {
				navItem = next.find((nav) => pathname.startsWith(nav.link));
				navList = next;
			}
		}
		return [appItem, navList, navItem];
	}, [pathname]);
	const routeItem = useMemo(() => {
		return RouteTable.find((item) => pathname.startsWith(item.url));
	}, [pathname]);
	const [subMenu, setSubMenu] = useState<string | null>(
		appItem?.itemKey ?? null,
	);
	const [drawerOpen, setDrawerOpen] = useState(false);
	return (
		<>
			{/* 电脑端 */}
			<div className="hidden md:block">
				<div className="w-screen flex">
					<div className="bg-background h-screen flex flex-col w-sidebar">
						<div className="flex h-12 border-b items-center border-r">
							<Image src={Logo} alt={"易千工作台"} className="h-7 w-7 ml-4" />
							<div className="ml-4 font-bold">易千工作台</div>
						</div>
						<div className="flex-1">
							<Nav
								selectedKeys={[appItem?.itemKey]}
								isCollapsed={true}
								items={NavAppList}
								className="bg-background h-full"
								onClick={handleNavClick(NavAppList)}
							/>
							<Nav
								selectedKeys={[navItem?.itemKey]}
								isCollapsed={false}
								items={navList ?? []}
								className="bg-background h-full"
								onClick={handleNavClick(navList ?? [])}
							/>
						</div>
					</div>
					<div className="flex-1 h-screen flex flex-col min-w-0">
						<div className="h-12 flex items-center border-b">
							{routeItem && (
								<>
									<div className="text-title ml-4 mt-1.5">{routeItem.icon}</div>
									<div className="ml-2 font-bold">{routeItem.title}</div>
								</>
							)}
							<Dropdown
								position="bottomRight"
								render={
									<div className="w-64">
										<UserCard payload={payload} />
									</div>
								}
							>
								<div className="ml-auto mr-4">
									<Avatar
										color="light-blue"
										alt={payload.user.info.name}
										size="small"
									>
										{payload.user.info.name.slice(
											-1,
											payload.user.info.name.length,
										)}
									</Avatar>
								</div>
							</Dropdown>
						</div>
						<div className="flex-1 p-2 min-w-0 overflow-auto">
							<div className="w-full min-w-0 overflow-auto">{children}</div>
						</div>
					</div>
				</div>
			</div>
			{/* 手机端 */}
			<div className="md:hidden">
				<div className="flex h-12 border-b items-center fixed l-0 t-0 bg-background w-screen z-10">
					<Drawer
						direction="left"
						open={drawerOpen}
						onOpenChange={(open) => {
							setDrawerOpen(open);
							setSubMenu(appItem?.itemKey ?? null);
						}}
					>
						<DrawerTrigger asChild>
							<Button
								icon={<IconMenu />}
								aria-label="菜单"
								className="ml-2"
								theme="borderless"
							/>
						</DrawerTrigger>
						<DrawerContent className="h-full rounded-none w-72">
							{subMenu === null ? (
								<>
									<UserCard
										payload={payload}
										onCloseNav={() => setDrawerOpen(false)}
									/>
									<Divider />
									<Nav
										selectedKeys={[appItem?.itemKey]}
										isCollapsed={false}
										items={
											appItem === null
												? NavAppList
												: [
														...NavAppList,
														{
															itemKey: "back",
															text: "返回",
															icon: <IconArrowRight />,
														},
													]
										}
										className="w-full bg-background"
										onClick={(target) => {
											if (target.itemKey === "back") {
												setSubMenu(appItem?.itemKey ?? null);
												return;
											}
											handleNavClick(NavAppList)(target);
											setDrawerOpen(false);
										}}
									/>
								</>
							) : (
								<MobileSubMenu
									subMenu={subMenu}
									onBack={() => setSubMenu(null)}
									nav={navItem?.itemKey ?? null}
									onNavClick={(target) => {
										handleNavClick(navList ?? [])(target);
										setDrawerOpen(false);
									}}
								/>
							)}
						</DrawerContent>
					</Drawer>
					<Image src={Logo} alt={"易千工作台"} className="h-7 w-7 ml-2" />
					<div className="ml-4 font-bold">易千工作台</div>
				</div>
				<div className="pt-16 pb-4 px-1">
					{routeItem && (
						<div className="flex items-center mx-1 mb-2">
							<div className="text-title mt-1.5">{routeItem.icon}</div>
							<div className="ml-2 font-bold">{routeItem.title}</div>
						</div>
					)}
					{children}
				</div>
			</div>
		</>
	);
}
