"use client";

import { useEffect } from "react";
import { ReadonlyURLSearchParams, useRouter } from "next/navigation";

/**
 * 当 searchParams 变化（含浏览器前进/后退）时，调用 router.refresh()
 * 使 Server Component 用当前 URL 重新拉取数据。
 * 用于依赖 searchParams 的列表/分页/筛选页面。
 */
export function useRefreshOnSearchParamsChange(
	searchParams: ReadonlyURLSearchParams,
) {
	const router = useRouter();
	const searchParamsString = searchParams.toString();
	useEffect(() => {
		router.refresh();
	}, [router, searchParamsString]);
}

export function useRefreshOnPathnameChange(pathname: string) {
	const router = useRouter();
	useEffect(() => {
		router.refresh();
	}, [router, pathname]);
}
