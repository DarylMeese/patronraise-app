import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Event, ListResponse } from '../../types';

export function HostUpcomingEvents() {
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
				const now = Date.now();
				const upcoming = data.items.filter((e) => {
					if (e.source !== 'patron_raise') return false;
					if (e.status === 'cancelled' || e.status === 'archived') return false;
					const firstOcc = e.occurrences?.[0];
					if (!firstOcc?.startAt) return true;
					return new Date(firstOcc.startAt).getTime() >= now;
				});
				setEvents(upcoming);
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [activeOrganizationId]);

	if (!activeOrganizationId) {
		return (
			<div className="pr-app-page">
				<h1>Upcoming Events</h1>
				<div className="pr-app-alert pr-app-alert--info">
					Set an Organization ID in the sidebar.
				</div>
			</div>
		);
	}

	return (
		<div className="pr-app-page">
			<h1>Upcoming Events</h1>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			{loading ? (
				<p>Loading events...</p>
			) : events.length === 0 ? (
				<div className="pr-app-empty">
					<p>No upcoming events.</p>
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
											<Link
												to={`/host/events/${event.id}/report`}
												className="pr-app-btn pr-app-btn--sm pr-app-btn--secondary"
											>
												Report
											</Link>
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
