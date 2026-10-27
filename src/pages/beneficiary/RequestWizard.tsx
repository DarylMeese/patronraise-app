import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Calendar } from '../../components/Calendar';
import type { Offer } from '../../types';

type Step = 'offer' | 'date' | 'confirm' | 'done';

export function RequestWizard() {
	const { offerUid } = useParams<{ offerUid: string }>();
	const { activeOrganizationId } = useAuth();
	const navigate = useNavigate();

	const [offer, setOffer] = useState<Offer | null>(null);
	const [step, setStep] = useState<Step>('offer');
	const [selectedDate, setSelectedDate] = useState('');
	const [campaignId, setCampaignId] = useState('');
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!offerUid) return;

		api.get<Offer>(`patron-raise/offers/${offerUid}`)
			.then(setOffer)
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [offerUid]);

	const handleDateSelect = (date: string) => {
		setSelectedDate(date);
		setStep('confirm');
	};

	const handleSubmit = async () => {
		if (!offerUid || !selectedDate) return;

		setSubmitting(true);
		setError('');

		try {
			const headers: Record<string, string> = {};
			if (activeOrganizationId) {
				headers['x-organization-id'] = activeOrganizationId;
			}

			await api.post(
				'patron-raise/partnerships/request',
				{
					offerId: offer?.fundraiserHostOfferId,
					campaignId: campaignId || undefined,
					proposedTerms: {
						date: selectedDate,
					},
				},
				headers
			);

			setStep('done');
		} catch (err: any) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <div className="pr-app-page"><p>Loading offer details...</p></div>;
	}

	if (!offer) {
		return <div className="pr-app-page"><p>Offer not found.</p></div>;
	}

	return (
		<div className="pr-app-page">
			<h1>Request Partnership</h1>

			{/* Step indicators */}
			<div className="pr-app-wizard-steps">
				{['Offer', 'Date', 'Confirm'].map((label, i) => {
					const stepNames: Step[] = ['offer', 'date', 'confirm'];
					const isCurrent = step === stepNames[i];
					const isDone = stepNames.indexOf(step) > i || step === 'done';
					return (
						<span
							key={label}
							className={`pr-app-wizard-step ${isCurrent ? 'pr-app-wizard-step--active' : ''} ${isDone ? 'pr-app-wizard-step--done' : ''}`}
						>
							{i + 1}. {label}
						</span>
					);
				})}
			</div>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			{/* Step 1: Review Offer */}
			{step === 'offer' && (
				<div className="pr-app-card">
					<h2>{offer.title}</h2>
					{offer.summary && <p>{offer.summary}</p>}
					{offer.terms && (
						<div>
							<h3>Terms</h3>
							<p className="pr-app-text-muted">{offer.terms}</p>
						</div>
					)}
					<div className="pr-app-card__meta">
						<span>
							Giveback: {offer.givebackType === 'percent'
								? `${offer.givebackValue}%`
								: `$${offer.givebackValue}`}
						</span>
					</div>

					<div className="pr-app-form__field" style={{ marginTop: '1rem' }}>
						<label htmlFor="wizard-campaign">Campaign ID (optional)</label>
						<input
							id="wizard-campaign"
							type="text"
							value={campaignId}
							onChange={(e) => setCampaignId(e.target.value)}
							placeholder="Link to a campaign (optional)"
						/>
					</div>

					<button
						onClick={() => setStep('date')}
						className="pr-app-btn pr-app-btn--primary"
						style={{ marginTop: '1rem' }}
					>
						Select Date
					</button>
				</div>
			)}

			{/* Step 2: Select Date */}
			{step === 'date' && (
				<div className="pr-app-card">
					<h2>Select a Date</h2>
					<p className="pr-app-text-muted">Click an available date to continue.</p>
					<Calendar offerId={offerUid!} onDateSelect={handleDateSelect} />
					<button
						onClick={() => setStep('offer')}
						className="pr-app-btn pr-app-btn--secondary"
						style={{ marginTop: '1rem' }}
					>
						Back
					</button>
				</div>
			)}

			{/* Step 3: Confirm */}
			{step === 'confirm' && (
				<div className="pr-app-card">
					<h2>Confirm Request</h2>
					<dl className="pr-app-dl">
						<dt>Offer</dt>
						<dd>{offer.title}</dd>
						<dt>Date</dt>
						<dd>{selectedDate}</dd>
						<dt>Giveback</dt>
						<dd>
							{offer.givebackType === 'percent'
								? `${offer.givebackValue}%`
								: `$${offer.givebackValue}`}
						</dd>
						{campaignId && (
							<>
								<dt>Campaign</dt>
								<dd>{campaignId}</dd>
							</>
						)}
					</dl>

					<div className="pr-app-form__actions" style={{ marginTop: '1.5rem' }}>
						<button
							onClick={handleSubmit}
							className="pr-app-btn pr-app-btn--primary"
							disabled={submitting}
						>
							{submitting ? 'Submitting...' : 'Submit Request'}
						</button>
						<button
							onClick={() => setStep('date')}
							className="pr-app-btn pr-app-btn--secondary"
							disabled={submitting}
						>
							Change Date
						</button>
					</div>
				</div>
			)}

			{/* Step 4: Done */}
			{step === 'done' && (
				<div className="pr-app-card">
					<h2>Request Submitted!</h2>
					<p>Your partnership request has been sent to the host for approval.</p>
					<button
						onClick={() => navigate('/beneficiary/requests')}
						className="pr-app-btn pr-app-btn--primary"
						style={{ marginTop: '1rem' }}
					>
						View My Requests
					</button>
				</div>
			)}
		</div>
	);
}
