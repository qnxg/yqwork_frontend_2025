export interface Payload {
	name: string;
	message?: string;
}

export const parseDigestPayload = (err: Error): Payload | null => {
	const withDigest = err as Error & { digest?: string };
	if (withDigest.digest && withDigest.digest.startsWith("encoded:")) {
		const payload = JSON.parse(withDigest.digest.slice(8)) as {
			name: string;
			message?: string;
		};
		return payload;
	}
	return null;
};

export class AppError extends Error {
	public readonly digest: string;
	constructor(name: string, message?: string) {
		super(message);
		// 为了对抗 Next.js 的脱敏处理
		const payload: Payload = {
			name,
			message,
		};
		this.digest = "encoded:" + JSON.stringify(payload);
	}
}

export class AuthorizationError extends AppError {
	constructor() {
		super("AUTHORIZATION_ERROR", "未授权访问");
	}
}

export class PermissionDeniedError extends AppError {
	constructor() {
		super("PERMISSION_DENIED_ERROR", "权限不足");
	}
}

export class NotFoundError extends AppError {
	constructor(message?: string) {
		super("NOT_FOUND_ERROR", message);
	}
}

export class RequestError extends AppError {
	constructor(message?: string) {
		super("REQUEST_ERROR", message);
	}
}

export class InternalError extends AppError {
	constructor(message?: string) {
		super("INTERNAL_ERROR", message);
	}
}
