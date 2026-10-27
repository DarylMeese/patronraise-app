import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth, ApiError } from '../api/client';
import type { User } from '../types';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	activeOrganizationId: string | null;
}

interface AuthContextValue extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
	logout: () => Promise<void>;
	switchOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		activeOrganizationId: null,
	});

	// Restore session on mount.
	useEffect(() => {
		auth.me()
			.then((user) => {
				setState({
					user,
					isAuthenticated: true,
					isLoading: false,
					activeOrganizationId: localStorage.getItem('patronraise_active_org'),
				});
			})
			.catch(() => {
				setState((prev) => ({ ...prev, isLoading: false }));
			});
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const user = await auth.login(email, password);
		// Fetch full profile after login.
		const profile = await auth.me();
		setState({
			user: profile,
			isAuthenticated: true,
			isLoading: false,
			activeOrganizationId: localStorage.getItem('patronraise_active_org'),
		});
	}, []);

	const register = useCallback(async (data: { email: string; password: string; first_name: string; last_name: string }) => {
		await auth.register(data);
		// Auto-login after registration.
		await login(data.email, data.password);
	}, [login]);

	const logout = useCallback(async () => {
		try {
			await auth.logout();
		} catch {
			// Ignore logout errors — clear state regardless.
		}
		localStorage.removeItem('patronraise_active_org');
		setState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			activeOrganizationId: null,
		});
	}, []);

	const switchOrganization = useCallback((orgId: string) => {
		localStorage.setItem('patronraise_active_org', orgId);
		setState((prev) => ({ ...prev, activeOrganizationId: orgId }));
	}, []);

	return (
		<AuthContext.Provider value={{ ...state, login, register, logout, switchOrganization }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
