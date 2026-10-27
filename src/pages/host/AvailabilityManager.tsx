import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AvailabilityEditor } from '../../components/AvailabilityEditor';
import { Calendar } from '../../components/Calendar';
import type { Offer, AvailabilityDay } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager() {
	const { publicUid } = useParams<{ publicUid: string }>();
	const [offer, setOffer] = useState<Offer | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Override form state.
	const [overrideDate, setOverrideDate] = useState('');
	const [overrideStatus, setOverrideStatus] = useState<'open' | 'closed'>('closed');
	const [overrideReason, setOverrideReason] = useState('');
	const [overrideSaving, setOverrideSaving] = useState(false);

	useEffect(() => {
		if (!publicUid) return;

		api.get<Offer>(`patron-raise/offers/${publicUid}`)
			.then(setOffer)
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [publicUid]);

	const handleAddOverride = async () => {
		if (!publicUid || !overrideDate) return;

		setOverrideSaving(true);
		setError('');

		try {
			await api.post(`patron-raise/offers/${publicUid}/overrides`, {
				date: overrideDate,
				status: overrideStatus,
				reason: overrideReason,
			});
			setOverrideDate('');
			setOverrideReason('');
			// Refresh offer to update calendar.
			const updated = await api.get<Offer>(`patron-raise/offers/${publicUid}`);
			setOffer(updated);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setOverrideSaving(false);
		}
	};

	const handleDeleteOverride = async (date: string) => {
		if (!publicUid) return;
		if (!confirm(`Remove the override for ${date}?`)) return;

		try {
			await api.del(`patron-raise/offers/${publicUid}/overrides/${date}`);
			const updated = await api.get<Offer>(`patron-raise/offers/${publicUid}`);
			setOffer(updated);
		} catch (err: any) {
			setError(err.message);
		}
	};

	if (loading) {
		return <div className="pr-app-page"><p>Loading availability...</p></div>;
	}

	if (!offer) {
		return <div className="pr-app-page"><p>Offer not found.</p></div>;
	}

	return (
		<div className="pr-app-page">
			<h1>Availability: {offer.title}</h1>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			<div className="pr-app-grid pr-app-grid--2col">
				{/* Left column: Weekly hours + overrides */}
				<div>
					<section className="pr-app-card">
						<h2>Weekly Availability</h2>
						<AvailabilityEditor
							availabilities={offer.availabilities}
							offerId={publicUid!}
						/>
					</section>

					<section className="pr-app-card" style={{ marginTop: '1.5rem' }}>
						<h2>Date Overrides</h2>
						<p className="pr-app-text-muted">Add one-off closures or special open dates.</p>

						<div className="pr-app-form__row" style={{ marginTop: '1rem' }}>
							<div className="pr-app-form__field">
								<label htmlFor="override-date">Date</label>
								<input
									id="override-date"
									type="date"
									value={overrideDate}
									onChange={(e) => setOverrideDate(e.target.value)}
								/>
							</div>
							<div className="pr-app-form__field">
								<label htmlFor="override-status">Status</label>
								<select
									id="override-status"
									value={overrideStatus}
									onChange={(e) => setOverrideStatus(e.target.value as 'open' | 'closed')}
								>
									<option value="closed">Closed</option>
									<option value="open">Open</option>
								</select>
							</div>
							<div className="pr-app-form__field">
								<label htmlFor="override-reason">Reason</label>
								<input
									id="override-reason"
									type="text"
									value={overrideReason}
									onChange={(e) => setOverrideReason(e.target.value)}
									placeholder="e.g., Holiday"
								/>
							</div>
						</div>
						<button
							onClick={handleAddOverride}
							className="pr-app-btn pr-app-btn--primary pr-app-btn--sm"
							disabled={overrideSaving || !overrideDate}
						>
							{overrideSaving ? 'Saving...' : 'Add Override'}
						</button>
					</section>
				</div>

				{/* Right column: Calendar preview */}
				<div>
					<section className="pr-app-card">
						<h2>Calendar Preview</h2>
						<Calendar offerId={publicUid!} />
					</section>
				</div>
			</div>
		</div>
	);
}
