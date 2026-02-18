import { IWorkHoursRecord } from "@/api/qnxg/workHoursRecord";
import { API_URL_REMOTE, WAGE_PER_HOUR } from "@/config";
import { NavItem, RouteTableItem } from "@/config/nav";

export const clone = <T>(obj: T) => {
	return JSON.parse(JSON.stringify(obj)) as T;
};

export const formatToString = (v: unknown) => {
	if (v === undefined) return "undefined";
	if (v instanceof Error) return v.message;
	if (typeof v === "string") return v;
	if (typeof v === "object") return JSON.stringify(v, null, 2);
	return v!.toString();
};

export const genRouteTable = (list: NavItem[]) => {
	const routeTable: RouteTableItem[] = [];
	for (const item of list) {
		if (item.link) {
			routeTable.push({
				title: item.text,
				icon: item.largeIcon,
				url: item.link,
			});
		}
	}
	return routeTable;
};

/**
 * 判断是否存在某个权限
 */
export const hasPermission = (
	permissions: string[],
	target: string,
): boolean => {
	if (target === "*") return true;
	for (const perm of permissions) {
		if (perm === "*") return true;
		if (target.startsWith(perm)) return true;
	}
	return false;
};

export const isAdmin = (permissions: string[]): boolean => {
	if (permissions.includes("*")) return true;
	return ["system", "yq", "hdwsh"].some((v) => hasPermission(permissions, v));
};

export const getTotalHours = (record: IWorkHoursRecord) => {
	return record.workDescs.reduce((sum, item) => sum + item.hour, 0);
};
export const getTotalSalary = (record: IWorkHoursRecord) => {
	return getTotalHours(record) * WAGE_PER_HOUR;
};

/**
 * 将字符串截取指定长度
 * @param str 要截取的字符串
 * @param length 最长长度
 */
export const sliceString = (str: string, length: number = 20) => {
	if (str.length <= length) {
		return str;
	}
	return str.slice(0, length) + "...";
};

export const getProxyUrl = (url: string) => {
	// TODO 实现的还有点粗糙
	// blob: 开头是防止本地上传的临时文件被代理
	if (url.includes("qnxg.cn") || url.startsWith("blob:")) {
		return url;
	}
	return `${API_URL_REMOTE}/zhihu/wx-img-proxy?url=${encodeURIComponent(url)}`;
};

export const decodeProxyUrl = (url: string) => {
	if (!url.startsWith(API_URL_REMOTE)) {
		return url;
	}
	const originUrl = url.slice(API_URL_REMOTE.length);
	const decodedUrl = decodeURIComponent(originUrl);
	return decodedUrl;
};
