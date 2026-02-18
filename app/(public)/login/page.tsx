"use client";

import {
	IconArrowLeft,
	IconCheckCircleStroked,
	IconCrossStroked,
	IconIssueStroked,
	IconRefresh,
	IconSendStroked,
} from "@douyinfe/semi-icons";
import { Button, Form, Spin } from "@douyinfe/semi-ui-19";
import { FormApi } from "@douyinfe/semi-ui-19/lib/es/form";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	getAuthQrCodeApi,
	getAuthQrCodeStatusApi,
	getAuthQrCodeTokenApi,
	postLoginApi,
} from "@/api/qnxg/login";
import { setCookie } from "@/utils/cookie";
import { RequiredRule } from "@/utils/form";
import { withToast } from "@/utils/action";
import * as QRCode from "qrcode";
import { useRequest } from "ahooks";

export default function Page() {
	const [scanLogin, setScanLogin] = useState(false);
	return (
		<div>
			<div className="mx-auto max-w-lg p-2 mt-20">
				<div className="shadow-lg border rounded">
					<div className="bg-primary h-1"></div>
					<div className="m-4">
						<div className="text-2xl text-primary font-bold">登录</div>
						<div className="text-title text-sm mt-1">
							{scanLogin ? "使用微信扫描二维码登录" : "登录到易千工作台"}
						</div>
						<div className="mt-4">
							{scanLogin ? (
								<ScanLogin setScanLogin={setScanLogin} />
							) : (
								<PasswordLogin setScanLogin={setScanLogin} />
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function PasswordLogin({
	setScanLogin,
}: {
	setScanLogin: (scanLogin: boolean) => void;
}) {
	const router = useRouter();
	const form = useRef<FormApi>(null);
	const [loading, setLoading] = useState(false);
	const handleLogin = async () => {
		if (!form.current) return;
		setLoading(true);
		try {
			const { username, password } = await form.current!.validate();
			const token = await withToast(
				() => postLoginApi(username, password),
				"登录成功",
			);
			setCookie("session", token, { maxAge: 60 * 60 * 24 });
			router.push("/dashboard");
		} catch {}
		setLoading(false);
	};
	return (
		<>
			<Form getFormApi={(api) => (form.current = api)}>
				<Form.Input label="学号" field="username" rules={[RequiredRule]} />
				<Form.Input
					label="密码"
					field="password"
					rules={[RequiredRule]}
					type="password"
				/>
			</Form>
			<div className="mt-4">
				<Button
					icon={<IconSendStroked />}
					onClick={handleLogin}
					loading={loading}
				>
					登录
				</Button>
				<Button
					type="secondary"
					className="ml-2"
					disabled={loading}
					onClick={() => setScanLogin(true)}
				>
					扫码登录
				</Button>
			</div>
		</>
	);
}

function ScanLogin({
	setScanLogin,
}: {
	setScanLogin: (scanLogin: boolean) => void;
}) {
	const router = useRouter();
	const codeRef = useRef<string | null>(null);
	const [status, setStatus] = useState<string>("loading");
	const [dataUrl, setDataUrl] = useState<string | null>(null);
	const getQrCode = async () => {
		setStatus("loading");
		try {
			const res = await withToast(() => getAuthQrCodeApi());
			if (res) {
				codeRef.current = res;
				setStatus("unused");
				// 生成二维码图片
				setDataUrl(
					await QRCode.toDataURL(`https://qnxg.cn/mp-qrcode/test0/${res}`, {
						width: 220,
						errorCorrectionLevel: "H",
					}),
				);
				// 开始轮询二维码状态
				startPolling();
			}
			setStatus("unused");
		} catch {
			setStatus("error");
		}
	};
	const handleLogin = async () => {
		setStatus("loading");
		try {
			const token = await withToast(() =>
				getAuthQrCodeTokenApi(codeRef.current!),
			);
			setCookie("session", token, { maxAge: 60 * 60 * 24 });
			router.push("/dashboard");
		} catch {
			getQrCode();
		}
	};
	const { run: startPolling, cancel: stopPolling } = useRequest(
		() => getAuthQrCodeStatusApi(codeRef.current!),
		{
			pollingInterval: 1000,
			pollingWhenHidden: false,
			manual: true,
			onSuccess: (res) => {
				if (res === "used") {
					stopPolling();
					handleLogin();
				} else {
					setStatus(res);
				}
			},
			onError(error) {
				if (error.message.includes("找不到二维码")) {
					setStatus("expired");
					stopPolling();
				}
			},
		},
	);
	// 生成二维码
	useEffect(() => {
		void getQrCode();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return (
		<>
			<div className="mt-4">
				<div className="flex justify-center items-center h-[220px]">
					{status === "loading" && <Spin size="large" />}
					{status === "error" && (
						<div className="flex flex-col items-center">
							<IconCrossStroked className="text-red-500 text-2xl" />
							<div className="text-red-500 text-xs my-2">获取二维码失败</div>
							<Button
								theme="borderless"
								type="primary"
								icon={<IconRefresh />}
								onClick={getQrCode}
							>
								重新获取
							</Button>
						</div>
					)}
					{status === "using" && (
						<div className="flex flex-col items-center">
							<IconCheckCircleStroked className="text-2xl" />
							<div className="text-xs my-2">已扫描，请在手机上确认登录</div>
						</div>
					)}
					{status === "expired" && (
						<div className="flex flex-col items-center">
							<IconIssueStroked className="text-2xl" />
							<div className="text-xs my-2">二维码已过期，请重新获取</div>
							<Button
								theme="borderless"
								type="primary"
								icon={<IconRefresh />}
								onClick={getQrCode}
							>
								重新获取
							</Button>
						</div>
					)}
					{status === "unused" && dataUrl && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							className="w-[200px] h-[200px] cursor-pointer"
							src={dataUrl}
							alt=""
							onClick={() => {
								stopPolling();
								getQrCode();
							}}
						/>
					)}
				</div>
				<div>
					<Button
						type="secondary"
						icon={<IconArrowLeft />}
						onClick={() => setScanLogin(false)}
					>
						返回密码登录
					</Button>
				</div>
			</div>
		</>
	);
}
