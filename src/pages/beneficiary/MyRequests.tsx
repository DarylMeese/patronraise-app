import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Event, ListResponse } from '../../types';

export function MyRequests() {
	const { activeOrganizationId } = useAuth();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!activeOrganizationId) {
			setLoading(false);
			return;
		}

		api.get<ListResponse<Event>>(`organizations/${activeOrganizationId}/events`)
			.then((data) => {
				// Filter to patron_raise source events.
				setEvents(data.items.filter((e) => e.source === 'patron_raise'));
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [activeOrganizationId]);

	const handleCancel = async (eventId: number) => {
		if (!confirm('Cancel this partnership request?')) return;

		try {
			const headers: Record<string, string> = {};
			if (activeOrganizationId) {
				headers['x-organization-id'] = activeOrganizationId;
			}
			await api.post(`patron-raise/partnerships/${eventId}/cancel`, {}, headers);
			setEvents((prev) => prev.filter((e) => e.id !== eventId));
		} catch (err: any) {
			setError(err.message);
		}
	};

	if (!activeOrganizationId) {
		return (
			<div className="pr-app-page">
				<h1>My Requests</h1>
				<div className="pr-app-alert pr-app-alert--info">
					Set an Organization ID in the sidebar to view your requests.
				</div>
			</div>
		);
	}

	return (
		<div className="pr-app-page">
			<h1>My Requests</h1>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			{loading ? (
				<p>Loading requests...</p>
			) : events.length === 0 ? (
				<div className="pr-app-empty">
					<p>No partnership requests yet.</p>
				</div>
			) : (
				<div className="pr-app-table-wrap">
					<table className="pr-app-table">
						<thead>
							<tr>
								<th>Event</th>
								<th>Date</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{events.map((event) => {
								const firstOcc = event.occurrences?.[0];
								return (
									<tr key={event.id}>
										<td>{event.title}</td>
										<td>
											{firstOcc?.startAt
												? new Date(firstOcc.startAt).toLocaleDateString()
												: 'TBD'}
										</td>
										<td>
											<span className={`pr-app-badge pr-app-badge--${event.status}`}>
												{event.status}
											</span>
										</td>
										<td>
											{event.status !== 'cancelled' && (
												<button
													onClick={() => handleCancel(event.id)}
													className="pr-app-btn pr-app-btn--sm pr-app-btn--danger"
												>
													Cancel
												</button>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
