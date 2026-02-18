export class AppError extends Error {
	public readonly name: string;
	constructor(name: string, message?: string) {
		super(message);
		this.name = name;
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
