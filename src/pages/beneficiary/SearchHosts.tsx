import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Offer, ListResponse } from '../../types';

export function SearchHosts() {
	const { activeOrganizationId } = useAuth();
	const [offers, setOffers] = useState<Offer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		// Fetch published offers. Uses the org context if set.
		if (!activeOrganizationId) {
			setLoading(false);
			return;
		}

		api.get<ListResponse<Offer>>(`organizations/${activeOrganizationId}/patron-raise/offers`)
			.then((data) => {
				// Filter to only published offers.
				setOffers(data.items.filter((o) => o.status === 'published'));
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [activeOrganizationId]);

	return (
		<div className="pr-app-page">
			<h1>Find Host Offers</h1>
			<p className="pr-app-text-muted">Browse available fundraiser host offers and request a partnership.</p>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			{!activeOrganizationId && (
				<div className="pr-app-alert pr-app-alert--info">
					Set an Organization ID in the sidebar to browse host offers.
				</div>
			)}

			{loading ? (
				<p>Loading offers...</p>
			) : offers.length === 0 ? (
				<div className="pr-app-empty">
					<p>No published host offers found.</p>
				</div>
			) : (
				<div className="pr-app-card-grid">
					{offers.map((offer) => (
						<div key={offer.publicUid} className="pr-app-card">
							<h3>{offer.title}</h3>
							{offer.summary && (
								<p className="pr-app-text-muted">{offer.summary}</p>
							)}
							<div className="pr-app-card__meta">
								<span>
									Giveback: {offer.givebackType === 'percent'
										? `${offer.givebackValue}%`
										: `$${offer.givebackValue}`}
								</span>
								{parseFloat(offer.givebackCap) > 0 && (
									<span> (cap: ${offer.givebackCap})</span>
								)}
							</div>
							<div className="pr-app-card__meta">
								<span>Lead time: {offer.leadTimeDaysMin} days</span>
							</div>
							<Link
								to={`/beneficiary/request/${offer.publicUid}`}
								className="pr-app-btn pr-app-btn--primary pr-app-btn--sm"
								style={{ marginTop: '1rem' }}
							>
								Request Partnership
							</Link>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
