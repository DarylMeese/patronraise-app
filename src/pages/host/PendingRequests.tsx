import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Event, ListResponse } from '../../types';

export function PendingRequests() {
	const { activeOrganizationId } = useAuth();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	useEffect(() => {
		if (!activeOrganizationId) {
			setLoading(false);
			return;
		}

		api.get<ListResponse<Event>>(`organizations/${activeOrganizationId}/events`)
			.then((data) => {
				// Filter to patron_raise events that are pending.
				setEvents(data.items.filter(
					(e) => e.source === 'patron_raise' && e.status === 'draft'
				));
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [activeOrganizationId]);

	const tenantHeaders = (): Record<string, string> => {
		const h: Record<string, string> = {};
		if (activeOrganizationId) {
			h['x-organization-id'] = activeOrganizationId;
		}
		return h;
	};

	const handleApprove = async (eventId: number) => {
		if (!confirm('Approve this partnership request? The event will be locked.')) return;
		setActionLoading(eventId);

		try {
			await api.post(`patron-raise/partnerships/${eventId}/approve`, {}, tenantHeaders());
			setEvents((prev) => prev.filter((e) => e.id !== eventId));
		} catch (err: any) {
			setError(err.message);
		} finally {
			setActionLoading(null);
		}
	};

	const handleDecline = async (eventId: number) => {
		const reason = prompt('Reason for declining (optional):');
		if (reason === null) return; // Cancelled.

		setActionLoading(eventId);

		try {
			await api.post(`patron-raise/partnerships/${eventId}/decline`, { reason }, tenantHeaders());
			setEvents((prev) => prev.filter((e) => e.id !== eventId));
		} catch (err: any) {
			setError(err.message);
		} finally {
			setActionLoading(null);
		}
	};

	const handleRequestChanges = async (eventId: number) => {
		const reason = prompt('What changes are needed?');
		if (!reason) return;

		setActionLoading(eventId);

		try {
			await api.post(`patron-raise/partnerships/${eventId}/request-changes`, { reason }, tenantHeaders());
			setEvents((prev) => prev.filter((e) => e.id !== eventId));
		} catch (err: any) {
			setError(err.message);
		} finally {
			setActionLoading(null);
		}
	};

	if (!activeOrganizationId) {
		return (
			<div className="pr-app-page">
				<h1>Pending Requests</h1>
				<div className="pr-app-alert pr-app-alert--info">
					Set an Organization ID in the sidebar to view pending requests.
				</div>
			</div>
		);
	}

	return (
		<div className="pr-app-page">
			<h1>Pending Partnership Requests</h1>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			{loading ? (
				<p>Loading requests...</p>
			) : events.length === 0 ? (
				<div className="pr-app-empty">
					<p>No pending requests.</p>
				</div>
			) : (
				<div className="pr-app-card-grid">
					{events.map((event) => {
						const firstOcc = event.occurrences?.[0];
						const isProcessing = actionLoading === event.id;

						return (
							<div key={event.id} className="pr-app-card">
								<h3>{event.title}</h3>
								<div className="pr-app-card__meta">
									<span>
										Proposed date: {firstOcc?.startAt
											? new Date(firstOcc.startAt).toLocaleDateString()
											: 'TBD'}
									</span>
								</div>
								{event.description && (
									<p className="pr-app-text-muted">{event.description}</p>
								)}

								<div className="pr-app-card__actions" style={{ marginTop: '1rem' }}>
									<button
										onClick={() => handleApprove(event.id)}
										className="pr-app-btn pr-app-btn--sm pr-app-btn--primary"
										disabled={isProcessing}
									>
										Approve
									</button>
									<button
										onClick={() => handleRequestChanges(event.id)}
										className="pr-app-btn pr-app-btn--sm pr-app-btn--secondary"
										disabled={isProcessing}
									>
										Request Changes
									</button>
									<button
										onClick={() => handleDecline(event.id)}
										className="pr-app-btn pr-app-btn--sm pr-app-btn--danger"
										disabled={isProcessing}
									>
										Decline
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
