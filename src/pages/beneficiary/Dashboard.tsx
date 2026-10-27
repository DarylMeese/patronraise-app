import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Event, ListResponse } from '../../types';

export function BeneficiaryDashboard() {
	const { activeOrganizationId, user } = useAuth();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!activeOrganizationId) {
			setLoading(false);
			return;
		}

		api.get<ListResponse<Event>>(`organizations/${activeOrganizationId}/events`)
			.then((data) => {
				setEvents(data.items.filter((e) => e.source === 'patron_raise'));
			})
			.catch(() => setEvents([]))
			.finally(() => setLoading(false));
	}, [activeOrganizationId]);

	const pendingCount = events.filter((e) => e.status === 'draft').length;
	const upcomingCount = events.filter((e) => {
		if (e.status === 'cancelled' || e.status === 'archived') return false;
		const occ = e.occurrences?.[0];
		return occ?.startAt ? new Date(occ.startAt).getTime() >= Date.now() : false;
	}).length;

	return (
		<div className="pr-app-page">
			<h1>Beneficiary Dashboard</h1>
			{user && <p className="pr-app-text-muted">Welcome back, {user.name}.</p>}

			{!activeOrganizationId ? (
				<div className="pr-app-alert pr-app-alert--info">
					Set an Organization ID in the sidebar to see your dashboard.
				</div>
			) : loading ? (
				<p>Loading dashboard...</p>
			) : (
				<>
					<div className="pr-app-stat-grid">
						<div className="pr-app-stat-card">
							<span className="pr-app-stat-card__value">{pendingCount}</span>
							<span className="pr-app-stat-card__label">Pending Requests</span>
						</div>
						<div className="pr-app-stat-card">
							<span className="pr-app-stat-card__value">{upcomingCount}</span>
							<span className="pr-app-stat-card__label">Upcoming Events</span>
						</div>
					</div>

					<div className="pr-app-quick-links">
						<Link to="/beneficiary/search" className="pr-app-btn pr-app-btn--primary">Find Host Offers</Link>
						<Link to="/beneficiary/requests" className="pr-app-btn pr-app-btn--secondary">My Requests</Link>
						<Link to="/beneficiary/events" className="pr-app-btn pr-app-btn--secondary">Upcoming Events</Link>
					</div>
				</>
			)}
		</div>
	);
}
