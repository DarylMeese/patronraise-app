import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Offer } from '../../types';

export function OfferEditor() {
	const { publicUid } = useParams<{ publicUid: string }>();
	const { activeOrganizationId } = useAuth();
	const navigate = useNavigate();
	const isEditing = Boolean(publicUid);

	const [form, setForm] = useState({
		title: '',
		summary: '',
		terms: '',
		givebackType: 'percent' as 'percent' | 'fixed',
		givebackValue: '15',
		givebackCap: '0',
		leadTimeDaysMin: '14',
		minRsvp: '0',
		status: 'draft' as string,
	});
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	// Load existing offer for editing.
	useEffect(() => {
		if (!publicUid) return;

		setLoading(true);
		api.get<Offer>(`patron-raise/offers/${publicUid}`)
			.then((offer) => {
				setForm({
					title: offer.title,
					summary: offer.summary || '',
					terms: offer.terms || '',
					givebackType: offer.givebackType,
					givebackValue: offer.givebackValue,
					givebackCap: offer.givebackCap,
					leadTimeDaysMin: String(offer.leadTimeDaysMin),
					minRsvp: String(offer.minRsvp),
					status: offer.status,
				});
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [publicUid]);

	const handleChange = (field: string) => (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');

		if (!form.title.trim()) {
			setError('Title is required.');
			return;
		}

		if (!activeOrganizationId && !isEditing) {
			setError('Set an Organization ID in the sidebar first.');
			return;
		}

		setSaving(true);

		try {
			const payload = {
				title: form.title,
				description: form.summary,
				percentageSplit: form.givebackType === 'percent' ? parseFloat(form.givebackValue) : undefined,
				terms: form.terms,
				status: form.status,
			};

			if (isEditing) {
				await api.patch(`patron-raise/offers/${publicUid}`, payload);
			} else {
				await api.post(`organizations/${activeOrganizationId}/patron-raise/offers`, payload);
			}

			navigate('/host/offers');
		} catch (err: any) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="pr-app-page"><p>Loading offer...</p></div>;
	}

	return (
		<div className="pr-app-page">
			<h1>{isEditing ? 'Edit Offer' : 'Create Offer'}</h1>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			<form onSubmit={handleSubmit} className="pr-app-form pr-app-form--card">
				<div className="pr-app-form__field">
					<label htmlFor="offer-title">Title *</label>
					<input
						id="offer-title"
						type="text"
						value={form.title}
						onChange={handleChange('title')}
						maxLength={255}
						required
						disabled={saving}
					/>
				</div>

				<div className="pr-app-form__field">
					<label htmlFor="offer-summary">Summary</label>
					<textarea
						id="offer-summary"
						value={form.summary}
						onChange={handleChange('summary')}
						rows={3}
						disabled={saving}
					/>
				</div>

				<div className="pr-app-form__field">
					<label htmlFor="offer-terms">Terms</label>
					<textarea
						id="offer-terms"
						value={form.terms}
						onChange={handleChange('terms')}
						rows={4}
						disabled={saving}
					/>
				</div>

				<div className="pr-app-form__row">
					<div className="pr-app-form__field">
						<label htmlFor="offer-giveback-type">Giveback Type</label>
						<select
							id="offer-giveback-type"
							value={form.givebackType}
							onChange={handleChange('givebackType')}
							disabled={saving}
						>
							<option value="percent">Percentage</option>
							<option value="fixed">Fixed Amount</option>
						</select>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="offer-giveback-value">
							Giveback {form.givebackType === 'percent' ? '(%)' : '($)'}
						</label>
						<input
							id="offer-giveback-value"
							type="number"
							value={form.givebackValue}
							onChange={handleChange('givebackValue')}
							min="0"
							max={form.givebackType === 'percent' ? '100' : undefined}
							step="0.01"
							disabled={saving}
						/>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="offer-giveback-cap">Giveback Cap ($)</label>
						<input
							id="offer-giveback-cap"
							type="number"
							value={form.givebackCap}
							onChange={handleChange('givebackCap')}
							min="0"
							step="0.01"
							disabled={saving}
						/>
					</div>
				</div>

				<div className="pr-app-form__row">
					<div className="pr-app-form__field">
						<label htmlFor="offer-lead-time">Minimum Lead Time (days)</label>
						<input
							id="offer-lead-time"
							type="number"
							value={form.leadTimeDaysMin}
							onChange={handleChange('leadTimeDaysMin')}
							min="0"
							disabled={saving}
						/>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="offer-min-rsvp">Minimum RSVPs</label>
						<input
							id="offer-min-rsvp"
							type="number"
							value={form.minRsvp}
							onChange={handleChange('minRsvp')}
							min="0"
							disabled={saving}
						/>
					</div>

					<div className="pr-app-form__field">
						<label htmlFor="offer-status">Status</label>
						<select
							id="offer-status"
							value={form.status}
							onChange={handleChange('status')}
							disabled={saving}
						>
							<option value="draft">Draft</option>
							<option value="active">Active (Published)</option>
						</select>
					</div>
				</div>

				<div className="pr-app-form__actions">
					<button
						type="submit"
						className="pr-app-btn pr-app-btn--primary"
						disabled={saving}
					>
						{saving ? 'Saving...' : isEditing ? 'Update Offer' : 'Create Offer'}
					</button>
					<button
						type="button"
						onClick={() => navigate('/host/offers')}
						className="pr-app-btn pr-app-btn--secondary"
						disabled={saving}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
