"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
	Button,
	Table,
	Modal,
	Form,
	Card,
	Space,
	Tag,
	Descriptions,
	Col,
	Row,
} from "@douyinfe/semi-ui-19";
import {
	IUser,
	postUserApi,
	putUserByIdApi,
	deleteUserByIdApi,
	IUserPageResponseData,
	IUserPageQueryData,
	IUserPostData,
	IUserPutData,
} from "@/api/qnxg/user";
import { IDepartment } from "@/api/qnxg/department";
import { IRole } from "@/api/qnxg/role";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { UserStatusOptions, XueyuanOptions } from "@/config/fields";
import { hasPermission, isAdmin } from "@/utils";
import { IconDelete, IconEdit, IconPlus } from "@douyinfe/semi-icons";
import {
	labelWithHelp,
	QINGONGGANG_HELP,
	RequiredRule,
	ZAIKU_HELP,
} from "@/utils/form";
import { withToast } from "@/utils/action";

export interface UserIndexPayload {
	user: IUser;
	departments: IDepartment[];
	roles: IRole[];
	permissions: string[];
	data: IUserPageResponseData;
	queryData: IUserPageQueryData;
}

const PERMISSION_PREFIX = "yq:user";

// 从 URL searchParams 解析为 IUserPageQueryData
function parseQueryFromSearchParams(sp: URLSearchParams): IUserPageQueryData {
	return {
		page: sp.get("page") ? Number(sp.get("page")) : 1,
		pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 10,
		stuId: sp.get("stuId") ?? undefined,
		name: sp.get("name") ?? undefined,
		departmentId: sp.get("departmentId")
			? Number(sp.get("departmentId"))
			: undefined,
		status: sp.get("status") !== null ? Number(sp.get("status")) : undefined,
	};
}

const UserIndex = ({ payload }: { payload: UserIndexPayload }) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState("");

	const { canAdd, canEdit, canDelete } = useMemo(() => {
		const perms = payload.permissions;
		return {
			canAdd: hasPermission(perms, `${PERMISSION_PREFIX}:add`),
			canEdit: hasPermission(perms, `${PERMISSION_PREFIX}:edit`),
			canDelete: hasPermission(perms, `${PERMISSION_PREFIX}:delete`),
		};
	}, [payload.permissions]);

	// 当前查询参数从 URL（useSearchParams）读取
	const queryFromUrl = parseQueryFromSearchParams(searchParams);
	const currentPage = queryFromUrl.page ?? 1;
	const pageSize = queryFromUrl.pageSize ?? 10;

	// 数据使用 payload（由 Server Component 提供）
	const { rows: users, count: total, userRolesMap } = payload.data;

	// 模态框状态
	const [showDialog, setShowDialog] = useState(false);
	const [currentUser, setCurrentUser] = useState<IUser | null>(null);

	// 筛选表单状态
	const filterFormApi = useRef<FormApi>(null);
	const formApi = useRef<FormApi>(null);

	// 更新 searchParams 并触发重新加载（不滚动页面）
	const updateSearchParams = (params: IUserPageQueryData) => {
		const next = new URLSearchParams();
		if (params.page) next.set("page", String(params.page));
		if (params.pageSize) next.set("pageSize", String(params.pageSize));
		if (params.stuId) next.set("stuId", params.stuId);
		if (params.name) next.set("name", params.name);
		if (params.departmentId)
			next.set("departmentId", String(params.departmentId));
		if (params.status) next.set("status", String(params.status));
		setLoading("table");
		router.push(`${pathname}?${next.toString()}`, { scroll: false });
	};

	// 筛选/重置后，当新数据到达时清除 table loading
	useEffect(() => {
		setLoading((prev) => (prev === "table" ? "" : prev));
	}, [payload.data]);

	// 处理筛选
	const handleFilter = () => {
		if (!filterFormApi.current) return;
		const values = filterFormApi.current.getValues();
		updateSearchParams({
			page: 1,
			pageSize,
			stuId: values.学号?.trim() || undefined,
			name: values.姓名?.trim() || undefined,
			departmentId: values.部门 || undefined,
			status: values.在岗状态 ?? undefined,
		});
	};

	// 处理重置
	const handleReset = () => {
		filterFormApi.current?.reset();
		updateSearchParams({ page: 1, pageSize: 10 });
	};

	// 处理添加用户
	const handleAdd = async () => {
		if (!formApi.current) return;
		setLoading("add");
		try {
			const values = (await formApi.current.validate()) as IUserPostData;
			await withToast(() => postUserApi(values), "添加用户成功");
			setShowDialog(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	// 处理编辑用户
	const handleEdit = async () => {
		if (!formApi.current || !currentUser) return;
		setLoading("edit");
		try {
			const values = (await formApi.current!.validate()) as IUserPutData;
			await withToast(
				() => putUserByIdApi(currentUser.id, values),
				"编辑用户成功",
			);
			setCurrentUser(null);
			setShowDialog(false);
			router.refresh();
		} catch {}
		setLoading("");
	};

	// 处理删除用户
	const handleDelete = (userId: number) => {
		Modal.confirm({
			title: "确认删除",
			content: "确定要删除该用户吗？该操作不可逆。",
			onOk: async () => {
				setLoading(`delete-${userId}`);
				try {
					await withToast(() => deleteUserByIdApi(userId), "删除用户成功");
					router.refresh();
				} catch (err) {
					throw err;
				} finally {
					setLoading("");
				}
			},
		});
	};

	// 处理用户状态标签
	const renderStatusTag = (status: number) => {
		const option = UserStatusOptions.find((opt) => opt.value === status);
		return option ? (
			<Tag color={option.color}>{option.label}</Tag>
		) : (
			<Tag color="grey">未知</Tag>
		);
	};

	// 处理用户详情展开
	const expandedRowRender = (record: IUser) => {
		return (
			<Card className="mt-2">
				<Descriptions column={2}>
					<Descriptions.Item itemKey="邮箱地址">
						{record.info.email || "-"}
					</Descriptions.Item>
					<Descriptions.Item itemKey="学院">
						{XueyuanOptions.find((opt) => opt.value === record.info.xueyuan)
							?.label || "-"}
					</Descriptions.Item>
					<Descriptions.Item itemKey="是否在库">
						{record.info.zaiku ? "是" : "否"}
					</Descriptions.Item>
					<Descriptions.Item itemKey="是否在勤工岗">
						{record.info.qingonggang ? "是" : "否"}
					</Descriptions.Item>
					<Descriptions.Item itemKey="最后登录时间">
						{record.lastLogin
							? new Date(record.lastLogin).toLocaleString()
							: "-"}
					</Descriptions.Item>
				</Descriptions>
			</Card>
		);
	};

	// 表格列定义
	const columns = [
		{
			title: "学号",
			dataIndex: "info.stuId",
			key: "stuId",
			width: 150,
		},
		{
			title: "姓名",
			dataIndex: "info.name",
			key: "name",
			width: 100,
		},
		{
			title: "部门",
			dataIndex: "info.departmentId",
			key: "department",
			width: 150,
			render: (departmentId: number) => {
				const department = payload.departments.find(
					(d) => d.id === departmentId,
				);
				return department ? department.name : "-";
			},
		},
		{
			title: "岗位",
			dataIndex: "info.gangwei",
			key: "gangwei",
			width: 150,
			render: (gangwei?: string) => gangwei || "-",
		},
		{
			title: "角色",
			dataIndex: "roles",
			key: "roles",
			width: 200,
			render: (_: unknown, record: IUser) => {
				return (
					<Space wrap>
						{userRolesMap[record.id]?.map((role) => (
							<Tag key={role.id}>{role.name}</Tag>
						))}
					</Space>
				);
			},
		},
		{
			title: "在岗状态",
			dataIndex: "info.status",
			key: "status",
			width: 100,
			render: (status: number) => renderStatusTag(status),
		},
		{
			title: "操作",
			key: "action",
			width: 150,
			render: (_: unknown, record: IUser) => (
				<Space>
					{canEdit && (
						<Button
							theme="light"
							type="secondary"
							icon={<IconEdit />}
							onClick={() => {
								setCurrentUser(record);
								console.log("currentUser", record);
								setShowDialog(true);
							}}
							disabled={loading !== ""}
						>
							编辑
						</Button>
					)}
					{canDelete && record.id !== payload.user.id && (
						<Button
							theme="light"
							type="danger"
							icon={<IconDelete />}
							onClick={() => handleDelete(record.id)}
							loading={loading === `delete-${record.id}`}
							disabled={loading !== ""}
						>
							删除
						</Button>
					)}
				</Space>
			),
		},
	];

	const departmentOptions = payload.departments.map((dept) => ({
		label: dept.name,
		value: dept.id,
	}));

	// 获取可以设置的角色（对于管理员，可以设置所有的角色；非管理员只能设置自己角色的子集）
	const getRoleOptions = () => {
		if (isAdmin(payload.permissions)) {
			return payload.roles.map((role) => ({
				label: role.name,
				value: role.id,
			}));
		}
		const userRoles = userRolesMap[payload.user.id] || [];
		const userRoleIds = userRoles.map((r) => r.id);
		const availableRoles = payload.roles.filter((role) =>
			userRoleIds.includes(role.id),
		);
		return availableRoles.map((role) => ({
			label: role.name,
			value: role.id,
		}));
	};

	// 获取可以设置的部门选项
	const getDepartmentOptions = () => {
		if (isAdmin(payload.permissions)) {
			return departmentOptions;
		}
		return departmentOptions.filter(
			(opt) => opt.value === payload.user.info.departmentId,
		);
	};

	return (
		<div>
			<Card className="mb-4">
				<h4 className="text-lg font-medium mb-4">用户筛选</h4>
				<Form
					getFormApi={(api) => (filterFormApi.current = api)}
					initValues={{
						学号: queryFromUrl.stuId ?? "",
						姓名: queryFromUrl.name ?? "",
						部门: queryFromUrl.departmentId ?? undefined,
						在岗状态: queryFromUrl.status ?? undefined,
					}}
				>
					<Space wrap className="mb-4">
						<Form.Input
							field="学号"
							placeholder="请输入学号"
							className="w-48"
						/>
						<Form.Input
							field="姓名"
							placeholder="请输入姓名"
							className="w-48"
						/>
						<Form.Select
							field="部门"
							placeholder="请选择部门"
							optionList={departmentOptions}
							showClear
							className="w-64"
						/>
						<Form.Select
							field="在岗状态"
							placeholder="请选择在岗状态"
							optionList={UserStatusOptions}
							showClear
							className="w-48"
						/>
					</Space>
				</Form>
				<Space>
					<Button
						type="primary"
						onClick={handleFilter}
						loading={loading === "table"}
					>
						查询
					</Button>
					<Button onClick={handleReset} disabled={loading !== ""}>
						重置
					</Button>
				</Space>
			</Card>

			{canAdd && (
				<Button
					theme="solid"
					type="warning"
					className="mb-4"
					onClick={() => {
						setCurrentUser(null);
						setShowDialog(true);
					}}
					icon={<IconPlus />}
				>
					添加用户
				</Button>
			)}

			<Table
				columns={columns}
				dataSource={users}
				loading={loading === "table"}
				empty={<div>暂无用户数据</div>}
				expandedRowRender={(record?: IUser) => expandedRowRender(record!)}
				rowKey="id"
				pagination={{
					currentPage,
					pageSize,
					total,
					onChange: (newPage: number, newSize: number) => {
						updateSearchParams({
							page: newPage,
							pageSize: newSize,
							stuId: queryFromUrl.stuId,
							name: queryFromUrl.name,
							departmentId: queryFromUrl.departmentId,
							status: queryFromUrl.status,
						});
					},
				}}
			/>

			<Modal
				title={currentUser ? "编辑用户" : "添加用户"}
				visible={showDialog}
				onOk={currentUser ? handleEdit : handleAdd}
				onCancel={() => setShowDialog(false)}
				okText={currentUser ? "编辑" : "添加"}
				cancelText="取消"
				confirmLoading={loading === "add"}
				width={700}
			>
				<Form
					getFormApi={(api) => (formApi.current = api)}
					onSubmit={currentUser ? handleEdit : handleAdd}
					labelWidth={300}
					initValues={
						currentUser
							? {
									...currentUser.info,
									password: "",
									roleId: (userRolesMap[currentUser.id] || []).map((r) => r.id),
								}
							: undefined
					}
				>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Input
								field="name"
								label="姓名"
								rules={[RequiredRule]}
								placeholder="请输入姓名"
							/>
						</Col>
						<Col span={12}>
							<Form.Input
								field="stuId"
								label="学号"
								rules={[RequiredRule]}
								placeholder="请输入学号"
							/>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Input
								field="username"
								label="用户名"
								placeholder="请输入用户名"
							/>
						</Col>
						<Col span={12}>
							<Form.Input
								field="password"
								label="密码"
								type="password"
								rules={currentUser ? [] : [RequiredRule]}
								placeholder={currentUser ? "留空表示不修改密码" : "请输入密码"}
							/>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Input
								field="email"
								label="邮箱地址"
								placeholder="请输入邮箱地址"
							/>
						</Col>
						<Col span={12}>
							<Form.Select
								field="departmentId"
								label="部门"
								rules={[RequiredRule]}
								optionList={getDepartmentOptions()}
								placeholder="请选择部门"
								className="w-full"
							/>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Select
								field="xueyuan"
								label="学院"
								rules={[RequiredRule]}
								optionList={XueyuanOptions}
								placeholder="请选择学院"
								className="w-full"
							/>
						</Col>
						<Col span={12}>
							<Form.Input
								field="gangwei"
								label="岗位"
								placeholder="请输入岗位"
							/>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Select
								field="status"
								label="在岗状态"
								rules={[RequiredRule]}
								optionList={UserStatusOptions}
								placeholder="请选择在岗状态"
								className="w-full"
							/>
						</Col>
						<Col span={12}>
							<Form.Select
								field="roleId"
								label="角色"
								rules={[RequiredRule]}
								optionList={getRoleOptions()}
								placeholder="请选择角色"
								multiple={true}
								className="w-full"
							/>
						</Col>
					</Row>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Switch
								field="zaiku"
								label={labelWithHelp("是否在库", ZAIKU_HELP)}
								initValue={currentUser === null ? false : undefined}
							/>
						</Col>
						<Col span={12}>
							<Form.Switch
								field="qingonggang"
								label={labelWithHelp("是否在勤工岗", QINGONGGANG_HELP)}
								initValue={currentUser === null ? false : undefined}
							/>
						</Col>
					</Row>
				</Form>
			</Modal>
		</div>
	);
};

export default UserIndex;
