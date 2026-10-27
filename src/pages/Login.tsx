import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await login(email, password);
			navigate('/host');
		} catch (err: any) {
			setError(err.message || 'Login failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="pr-app-auth-page">
			<div className="pr-app-auth-card">
				<h1 className="pr-app-auth-card__title">Sign In</h1>
				<p className="pr-app-auth-card__subtitle">Sign in to your PatronRaise account</p>

				{error && (
					<div className="pr-app-alert pr-app-alert--error">{error}</div>
				)}

				<form onSubmit={handleSubmit} className="pr-app-form">
					<div className="pr-app-form__field">
						<label htmlFor="login-email">Email</label>
						<input
							id="login-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
							disabled={loading}
						/>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="login-password">Password</label>
						<input
							id="login-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
							disabled={loading}
						/>
					</div>

					<button
						type="submit"
						className="pr-app-btn pr-app-btn--primary pr-app-btn--full"
						disabled={loading}
					>
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>

				<p className="pr-app-auth-card__footer">
					Don't have an account? <Link to="/register">Create one</Link>
				</p>
			</div>
		</div>
	);
}
