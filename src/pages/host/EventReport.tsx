import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { EventReport as EventReportType } from '../../types';

export function EventReport() {
	const { eventId } = useParams<{ eventId: string }>();
	const { activeOrganizationId } = useAuth();
	const [report, setReport] = useState<EventReportType | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');

	const [form, setForm] = useState({
		hostReportedTotal: '',
		hostReportedGiveback: '',
		internalNotes: '',
	});

	const tenantHeaders = (): Record<string, string> => {
		const h: Record<string, string> = {};
		if (activeOrganizationId) {
			h['x-organization-id'] = activeOrganizationId;
		}
		return h;
	};

	useEffect(() => {
		if (!eventId) return;

		api.get<EventReportType>(`patron-raise/events/${eventId}/report`, tenantHeaders())
			.then((data) => {
				setReport(data);
				setForm({
					hostReportedTotal: data.hostReportedTotal || '',
					hostReportedGiveback: data.hostReportedGiveback || '',
					internalNotes: data.internalNotes || '',
				});
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [eventId]);

	const handleChange = (field: string) => (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSave = async (e: FormEvent) => {
		e.preventDefault();
		if (!eventId) return;

		setSaving(true);
		setError('');
		setMessage('');

		try {
			await api.put(`patron-raise/events/${eventId}/report`, {
				hostReportedTotal: form.hostReportedTotal ? parseFloat(form.hostReportedTotal) : undefined,
				hostReportedGiveback: form.hostReportedGiveback ? parseFloat(form.hostReportedGiveback) : undefined,
				internalNotes: form.internalNotes,
			}, tenantHeaders());
			setMessage('Report saved.');
		} catch (err: any) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleFinalize = async () => {
		if (!eventId) return;
		if (!confirm('Finalize this report? It will become read-only and cannot be edited.')) return;

		setSaving(true);
		setError('');

		try {
			const result = await api.post<EventReportType>(`patron-raise/events/${eventId}/report/finalize`, {}, tenantHeaders());
			setReport(result);
			setMessage('Report finalized.');
		} catch (err: any) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="pr-app-page"><p>Loading report...</p></div>;
	}

	if (!report) {
		return <div className="pr-app-page"><p>Report not found.</p></div>;
	}

	const isFinalized = Boolean(report.finalizedAt);

	return (
		<div className="pr-app-page">
			<h1>Event Report #{eventId}</h1>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}
			{message && <div className="pr-app-alert pr-app-alert--success">{message}</div>}

			{isFinalized && (
				<div className="pr-app-alert pr-app-alert--info">
					This report was finalized on {new Date(report.finalizedAt!).toLocaleDateString()} and cannot be edited.
				</div>
			)}

			{/* Summary stats */}
			<div className="pr-app-stat-grid">
				<div className="pr-app-stat-card">
					<span className="pr-app-stat-card__value">{report.totalParticipants}</span>
					<span className="pr-app-stat-card__label">Total Participants</span>
				</div>
				<div className="pr-app-stat-card">
					<span className="pr-app-stat-card__value">{report.verifiedParticipants}</span>
					<span className="pr-app-stat-card__label">Verified</span>
				</div>
				<div className="pr-app-stat-card">
					<span className="pr-app-stat-card__value">{report.totalReceiptsUploaded}</span>
					<span className="pr-app-stat-card__label">Receipts</span>
				</div>
				<div className="pr-app-stat-card">
					<span className="pr-app-stat-card__value">${report.selfReportedSpendTotal}</span>
					<span className="pr-app-stat-card__label">Self-Reported Spend</span>
				</div>
			</div>

			{/* Editable form */}
			<form onSubmit={handleSave} className="pr-app-form pr-app-form--card" style={{ marginTop: '1.5rem' }}>
				<h2>Host-Reported Numbers</h2>

				<div className="pr-app-form__row">
					<div className="pr-app-form__field">
						<label htmlFor="report-total">Total Sales ($)</label>
						<input
							id="report-total"
							type="number"
							value={form.hostReportedTotal}
							onChange={handleChange('hostReportedTotal')}
							step="0.01"
							min="0"
							disabled={isFinalized || saving}
						/>
					</div>
					<div className="pr-app-form__field">
						<label htmlFor="report-giveback">Giveback Amount ($)</label>
						<input
							id="report-giveback"
							type="number"
							value={form.hostReportedGiveback}
							onChange={handleChange('hostReportedGiveback')}
							step="0.01"
							min="0"
							disabled={isFinalized || saving}
						/>
					</div>
				</div>

				<div className="pr-app-form__field">
					<label htmlFor="report-notes">Internal Notes</label>
					<textarea
						id="report-notes"
						value={form.internalNotes}
						onChange={handleChange('internalNotes')}
						rows={3}
						disabled={isFinalized || saving}
					/>
				</div>

				{!isFinalized && (
					<div className="pr-app-form__actions">
						<button
							type="submit"
							className="pr-app-btn pr-app-btn--primary"
							disabled={saving}
						>
							{saving ? 'Saving...' : 'Save Report'}
						</button>
						<button
							type="button"
							onClick={handleFinalize}
							className="pr-app-btn pr-app-btn--danger"
							disabled={saving}
						>
							Finalize Report
						</button>
					</div>
				)}
			</form>
		</div>
	);
}
