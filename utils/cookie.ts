// utils/cookie.ts

type CookieOptions = {
	path?: string;
	domain?: string;
	maxAge?: number; // 秒数
	expires?: Date;
	secure?: boolean;
	sameSite?: "Strict" | "Lax" | "None";
};

export function setCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
) {
	let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

	if (options.maxAge != null) {
		cookie += `; max-age=${options.maxAge}`;
	}

	if (options.expires) {
		cookie += `; expires=${options.expires.toUTCString()}`;
	}

	if (options.path) {
		cookie += `; path=${options.path}`;
	} else {
		cookie += `; path=/`;
	}

	if (options.domain) {
		cookie += `; domain=${options.domain}`;
	}

	if (options.secure) {
		cookie += `; secure`;
	}

	if (options.sameSite) {
		cookie += `; samesite=${options.sameSite}`;
	}

	document.cookie = cookie;
}

export function getCookie(name: string): string | null {
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`),
	);
	return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string, path = "/") {
	document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
}
