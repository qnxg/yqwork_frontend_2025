"use server";

import { UPLOAD_SERVER_URL_REMOTE } from "@/config";
import { InternalError } from "@/utils/result";
import axios from "axios";

/**
 * 上传图片
 */
export const postUploadImgApi = async (file: File, subFolder?: string) => {
	const formData = new FormData();
	formData.append("img", file);
	// 如果有子文件夹，就添加到formData中
	if (subFolder) {
		// subFolder不能包含特殊字符，长度不能超过20
		if (subFolder.length > 20) {
			throw new InternalError("子文件夹名称不能超过20个字符");
		}
		const reg = /^[a-zA-Z0-9_-]+$/;
		if (!reg.test(subFolder)) {
			throw new InternalError("子文件夹名称只能包含字母、数字、下划线、短横杠");
		}
		formData.append("subFolder", subFolder);
	}
	const res = await axios.post(
		`${UPLOAD_SERVER_URL_REMOTE}/editor-upload`,
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		},
	);
	return res.data.data as { url: string };
};

/**
 * 上传文件
 */
export const postUploadFileApi = async (file: File, subFolder?: string) => {
	const formData = new FormData();
	formData.append("file", file);
	// 如果有子文件夹，就添加到formData中
	if (subFolder) {
		// subFolder不能包含特殊字符，长度不能超过20
		if (subFolder.length > 20) {
			throw new InternalError("子文件夹名称不能超过20个字符");
		}
		const reg = /^[a-zA-Z0-9_-]+$/;
		if (!reg.test(subFolder)) {
			throw new InternalError("子文件夹名称只能包含字母、数字、下划线、短横杠");
		}
		formData.append("subFolder", subFolder);
	}
	const res = await axios.post(
		`${UPLOAD_SERVER_URL_REMOTE}/upload-file`,
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		},
	);
	return res.data.data as { url: string };
};
