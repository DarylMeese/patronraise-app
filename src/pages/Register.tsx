import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Register() {
	const { register } = useAuth();
	const navigate = useNavigate();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		first_name: '',
		last_name: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');

		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters.');
			return;
		}

		setLoading(true);

		try {
			await register(formData);
			navigate('/host');
		} catch (err: any) {
			setError(err.message || 'Registration failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="pr-app-auth-page">
			<div className="pr-app-auth-card">
				<h1 className="pr-app-auth-card__title">Create Account</h1>
				<p className="pr-app-auth-card__subtitle">Join PatronRaise to start fundraising</p>

				{error && (
					<div className="pr-app-alert pr-app-alert--error">{error}</div>
				)}

				<form onSubmit={handleSubmit} className="pr-app-form">
					<div className="pr-app-form__row">
						<div className="pr-app-form__field">
							<label htmlFor="reg-first-name">First Name</label>
							<input
								id="reg-first-name"
								type="text"
								value={formData.first_name}
								onChange={handleChange('first_name')}
								required
								disabled={loading}
							/>
						</div>
						<div className="pr-app-form__field">
							<label htmlFor="reg-last-name">Last Name</label>
							<input
								id="reg-last-name"
								type="text"
								value={formData.last_name}
								onChange={handleChange('last_name')}
								required
								disabled={loading}
							/>
						</div>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="reg-email">Email</label>
						<input
							id="reg-email"
							type="email"
							value={formData.email}
							onChange={handleChange('email')}
							required
							autoComplete="email"
							disabled={loading}
						/>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="reg-password">Password</label>
						<input
							id="reg-password"
							type="password"
							value={formData.password}
							onChange={handleChange('password')}
							required
							minLength={8}
							autoComplete="new-password"
							disabled={loading}
						/>
						<span className="pr-app-form__hint">At least 8 characters</span>
					</div>

					<button
						type="submit"
						className="pr-app-btn pr-app-btn--primary pr-app-btn--full"
						disabled={loading}
					>
						{loading ? 'Creating account...' : 'Create Account'}
					</button>
				</form>

				<p className="pr-app-auth-card__footer">
					Already have an account? <Link to="/login">Sign in</Link>
				</p>
			</div>
		</div>
	);
}
