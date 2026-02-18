// import requestMxsc from "@/utils/requestMxsc";

// export type BookSourceVersionTypes = "current" | "backed_up";

// export type VersionData = {
// 	type: BookSourceVersionTypes;
// 	/** 最后编辑时间 */
// 	mtime: number;
// };

// export type VersionListResponseData = VersionData[];

// /**
//  * 获取萌新手册存在的版本列表
//  */
// export async function getFreshmenBookVersionListApi() {
// 	return requestMxsc.get<any, VersionListResponseData>(
// 		"/get-mdbook/version-list",
// 	);
// }

// /**
//  * 上传萌新手册新版本。
//  * @param new_content
//  * 新版本的md代码
//  * @param verify_mtime
//  * 键为版本，值为对应mtime的Map对象，萌新手册后端接口需要它来完成编辑冲突验证
//  */
// export async function postFreshmenBookNewContentApi(
// 	new_content: string,
// 	verify_mtime: Map<BookSourceVersionTypes, number>,
// ) {
// 	return requestMxsc.post("/modify-mdbook/update", {
// 		new_content: new_content,
// 		verify_mtime: Object.fromEntries(verify_mtime),
// 	});
// }

// export type FreshmenBookContentResponseData = {
// 	/** 最后编辑时间 */
// 	mtime: number;
// 	content: string;
// };

// /**
//  * 下载萌新手册源文件
//  */
// export async function getFreshmenBookContentApi(
// 	version: BookSourceVersionTypes,
// ) {
// 	return requestMxsc.get<any, FreshmenBookContentResponseData>(
// 		"/get-mdbook/md",
// 		{
// 			params: {
// 				version: version,
// 			},
// 		},
// 	);
// }

// /**
//  * 萌新手册回滚
//  * @param verify_mtime
//  * 键为版本，值为对应mtime的Map对象，萌新手册后端接口需要它来完成编辑冲突验证
//  */
// export async function postFreshmenBookRollbackApi(
// 	verify_mtime: Map<BookSourceVersionTypes, number>,
// ) {
// 	return requestMxsc.post("/modify-mdbook/rollback", {
// 		verify_mtime: Object.fromEntries(verify_mtime),
// 	});
// }
