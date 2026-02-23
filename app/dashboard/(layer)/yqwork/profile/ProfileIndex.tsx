"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Row, Col } from "@douyinfe/semi-ui-19";
import { putUserByIdApi, putUserPwdApi, IUserPutData } from "@/api/qnxg/user";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { UserStatusOptions, XueyuanOptions } from "@/config/fields";
import { RequiredRule } from "@/utils/form";
import { labelWithHelp, QINGONGGANG_HELP, ZAIKU_HELP } from "@/utils/form";
import { withToast } from "@/utils/action";
import { logout } from "@/utils/auth";
import { ProfilePayload } from "./page";

export default function ProfileIndex({ payload }: { payload: ProfilePayload }) {
	const router = useRouter();
	const { user, departments } = payload;
	const infoFormApi = useRef<FormApi>(null);
	const pwdFormApi = useRef<FormApi>(null);
	const [infoLoading, setInfoLoading] = useState(false);
	const [pwdLoading, setPwdLoading] = useState(false);

	const departmentOptions = departments.map((dept) => ({
		label: dept.name,
		value: dept.id,
	}));

	const handleSubmitInfo = async () => {
		if (!infoFormApi.current) return;
		setInfoLoading(true);
		try {
			const values = await infoFormApi.current.validate();
			const putData: IUserPutData = {
				...user.info,
				username: values.username?.trim() || undefined,
				email: values.email?.trim() || undefined,
			};
			await withToast(
				() => putUserByIdApi(user.id, putData),
				"个人信息更新成功",
			);
			router.refresh();
		} catch {}
		setInfoLoading(false);
	};

	const handleSubmitPwd = async () => {
		if (!pwdFormApi.current) return;
		setPwdLoading(true);
		try {
			const values = (await pwdFormApi.current.validate()) as {
				oldPassword: string;
				newPassword: string;
			};
			await withToast(() =>
				putUserPwdApi(values.oldPassword, values.newPassword),
			);
			// 修改密码成功后退出登录
			logout(router);
		} catch {}
		setPwdLoading(false);
	};

	return (
		<div className="space-y-6">
			{/* 第一部分：修改个人信息 */}
			<Card
				title={
					<div>
						<div className="text-[16px] font-bold">个人信息</div>
						<div className="text-xs text-gray-500">
							部分信息需要由部门负责人更改
						</div>
					</div>
				}
				className="mb-6"
			>
				<div className="max-w-[700]">
					<Form
						getFormApi={(api) => (infoFormApi.current = api)}
						onSubmit={handleSubmitInfo}
						labelWidth={120}
						initValues={{ ...user.info }}
					>
						<Row gutter={16}>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Input
									field="name"
									label="姓名"
									rules={[RequiredRule]}
									disabled
									placeholder="姓名"
								/>
							</Col>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Input
									field="stuId"
									label="学号"
									rules={[RequiredRule]}
									disabled
									placeholder="学号"
								/>
							</Col>
						</Row>
						<Row gutter={16}>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Input
									field="username"
									label="用户名"
									placeholder="请输入用户名"
								/>
							</Col>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Input
									field="email"
									label="邮箱地址"
									placeholder="请输入邮箱地址"
								/>
							</Col>
						</Row>
						<Row gutter={16}>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Select
									field="departmentId"
									label="部门"
									rules={[RequiredRule]}
									optionList={departmentOptions}
									placeholder="部门"
									className="w-full"
									disabled
								/>
							</Col>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Select
									field="xueyuan"
									label="学院"
									rules={[RequiredRule]}
									optionList={XueyuanOptions}
									placeholder="学院"
									className="w-full"
									disabled
								/>
							</Col>
						</Row>
						<Row gutter={16}>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Input
									field="gangwei"
									label="岗位"
									placeholder="岗位"
									disabled
								/>
							</Col>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Select
									field="status"
									label="在岗状态"
									rules={[RequiredRule]}
									optionList={UserStatusOptions}
									placeholder="在岗状态"
									className="w-full"
									disabled
								/>
							</Col>
						</Row>
						<Row gutter={16}>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Switch
									field="zaiku"
									label={labelWithHelp("是否在库", ZAIKU_HELP)}
									disabled
								/>
							</Col>
							<Col span={12} xs={24} sm={24} md={12}>
								<Form.Switch
									field="qingonggang"
									label={labelWithHelp("是否在勤工岗", QINGONGGANG_HELP)}
									disabled
								/>
							</Col>
						</Row>
						<Form.Slot label=" ">
							<Button type="primary" htmlType="submit" loading={infoLoading}>
								保存个人信息
							</Button>
						</Form.Slot>
					</Form>
				</div>
			</Card>

			{/* 第二部分：修改密码 */}
			<Card title="修改密码">
				<div className="max-w-[500]">
					<Form
						getFormApi={(api) => (pwdFormApi.current = api)}
						onSubmit={handleSubmitPwd}
						labelPosition="left"
						labelWidth={120}
					>
						<Form.Input
							field="oldPassword"
							label="旧密码"
							type="password"
							rules={[RequiredRule]}
							placeholder="请输入旧密码"
						/>
						<Form.Input
							field="newPassword"
							label="新密码"
							type="password"
							rules={[RequiredRule]}
							placeholder="请输入新密码"
						/>
						<Form.Slot label=" ">
							<Button
								type="primary"
								htmlType="submit"
								loading={pwdLoading}
								theme="solid"
							>
								修改密码
							</Button>
						</Form.Slot>
					</Form>
				</div>
			</Card>
		</div>
	);
}
