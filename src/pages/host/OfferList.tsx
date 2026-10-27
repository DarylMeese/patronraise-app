import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Offer, ListResponse } from '../../types';

export function OfferList() {
	const { activeOrganizationId } = useAuth();
	const [offers, setOffers] = useState<Offer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!activeOrganizationId) {
			setLoading(false);
			return;
		}

		setLoading(true);
		api.get<ListResponse<Offer>>(`organizations/${activeOrganizationId}/patron-raise/offers`)
			.then((data) => setOffers(data.items))
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, [activeOrganizationId]);

	const handleArchive = async (publicUid: string) => {
		if (!confirm('Archive this offer? It will no longer be visible to beneficiaries.')) return;

		try {
			await api.post(`patron-raise/offers/${publicUid}/archive`);
			setOffers((prev) => prev.filter((o) => o.publicUid !== publicUid));
		} catch (err: any) {
			setError(err.message);
		}
	};

	if (!activeOrganizationId) {
		return (
			<div className="pr-app-page">
				<h1>Offers</h1>
				<div className="pr-app-alert pr-app-alert--info">
					Set an Organization ID in the sidebar to manage offers.
				</div>
			</div>
		);
	}

	return (
		<div className="pr-app-page">
			<div className="pr-app-page__header">
				<h1>Fundraiser Host Offers</h1>
				<Link to="/host/offers/new" className="pr-app-btn pr-app-btn--primary">
					Create Offer
				</Link>
			</div>

			{error && <div className="pr-app-alert pr-app-alert--error">{error}</div>}

			{loading ? (
				<p>Loading offers...</p>
			) : offers.length === 0 ? (
				<div className="pr-app-empty">
					<p>No offers yet. Create your first fundraiser host offer to get started.</p>
				</div>
			) : (
				<div className="pr-app-table-wrap">
					<table className="pr-app-table">
						<thead>
							<tr>
								<th>Title</th>
								<th>Giveback</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{offers.map((offer) => (
								<tr 
                                    key={offer.publicUid}
                                    data-as-item-type="offer"
                                    data-as-item-id={offer.publicUid}
                                    data-as-version="v1"
                                >
									<td>
										<Link to={`/host/offers/${offer.publicUid}`}>
											{offer.title}
										</Link>
									</td>
									<td>
										{offer.givebackType === 'percent'
											? `${offer.givebackValue}%`
											: `$${offer.givebackValue}`}
									</td>
									<td>
										<span className={`pr-app-badge pr-app-badge--${offer.status}`}>
											{offer.status}
										</span>
									</td>
									<td>
										<div className="pr-app-table__actions">
											<Link
												to={`/host/offers/${offer.publicUid}`}
												className="pr-app-btn pr-app-btn--sm pr-app-btn--secondary"
											>
												Edit
											</Link>
											<Link
												to={`/host/offers/${offer.publicUid}/availability`}
												className="pr-app-btn pr-app-btn--sm pr-app-btn--secondary"
											>
												Availability
											</Link>
											{offer.status !== 'archived' && (
												<button
													onClick={() => handleArchive(offer.publicUid)}
													className="pr-app-btn pr-app-btn--sm pr-app-btn--danger"
												>
													Archive
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
