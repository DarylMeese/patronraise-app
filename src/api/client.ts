/**
 * API Client — fetch wrapper for the WordPress REST proxy.
 *
 * All requests go through /wp-json/patronraise-app/v1/.
 * Auth routes go directly, data routes go through /proxy/ prefix.
 */

const getConfig = () => window.patronraiseApp;

async function request<T>(
	method: string,
	path: string,
	body?: unknown,
	extraHeaders?: Record<string, string>
): Promise<T> {
	const config = getConfig();
	const url = `${config.apiBase}/${path.replace(/^\//, '')}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'X-WP-Nonce': config.nonce,
		...extraHeaders,
	};

	const init: RequestInit = {
		method,
		headers,
		credentials: 'same-origin',
	};

	if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
		init.body = JSON.stringify(body);
	}

	const response = await fetch(url, init);

	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}`;
		try {
			const errorData = await response.json();
			errorMessage = errorData.message || errorMessage;
		} catch {
			// Ignore JSON parse errors on error responses.
		}
		throw new ApiError(errorMessage, response.status);
	}

	// Handle 204 No Content.
	if (response.status === 204) {
		return { success: true } as T;
	}

	return response.json();
}

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

/** Auth endpoints (direct, not proxied) */
export const auth = {
	login: (email: string, password: string) =>
		request<{ user_id: string; email: string; name: string }>('POST', 'auth/login', { email, password }),

	register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
		request<{ user_id: string; email: string }>('POST', 'auth/register', data),

	logout: () =>
		request<{ success: boolean }>('POST', 'auth/logout'),

	me: () =>
		request<{ user_id: string; email: string; name: string; avatar: string | null; isNetworkAdmin: boolean }>('GET', 'auth/me'),
};

/** Proxied API calls — all go through /proxy/ prefix */
export const api = {
	get: <T>(path: string, headers?: Record<string, string>) =>
		request<T>('GET', `proxy/${path}`, undefined, headers),

	post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
		request<T>('POST', `proxy/${path}`, body, headers),

	patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
		request<T>('PATCH', `proxy/${path}`, body, headers),

	put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
		request<T>('PUT', `proxy/${path}`, body, headers),

	del: <T>(path: string, headers?: Record<string, string>) =>
		request<T>('DELETE', `proxy/${path}`, undefined, headers),
};
