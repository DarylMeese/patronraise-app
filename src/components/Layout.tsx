import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OrgSwitcher } from './OrgSwitcher';

export function Layout() {
	const { user, logout } = useAuth();

	return (
		<div className="pr-app-layout">
			<aside className="pr-app-sidebar">
				<div className="pr-app-sidebar__brand">
					<h2>PatronRaise</h2>
				</div>

				<nav className="pr-app-sidebar__nav">
					<div className="pr-app-sidebar__section">
						<h3 className="pr-app-sidebar__section-title">Host</h3>
						<NavLink to="/host" end className="pr-app-nav-link">Dashboard</NavLink>
						<NavLink to="/host/offers" className="pr-app-nav-link">Offers</NavLink>
						<NavLink to="/host/requests" className="pr-app-nav-link">Pending Requests</NavLink>
						<NavLink to="/host/events" className="pr-app-nav-link">Upcoming Events</NavLink>
					</div>

					<div className="pr-app-sidebar__section">
						<h3 className="pr-app-sidebar__section-title">Beneficiary</h3>
						<NavLink to="/beneficiary" end className="pr-app-nav-link">Dashboard</NavLink>
						<NavLink to="/beneficiary/search" className="pr-app-nav-link">Find Hosts</NavLink>
						<NavLink to="/beneficiary/requests" className="pr-app-nav-link">My Requests</NavLink>
						<NavLink to="/beneficiary/events" className="pr-app-nav-link">Upcoming Events</NavLink>
					</div>

					<div className="pr-app-sidebar__section">
						<NavLink to="/notifications" className="pr-app-nav-link">Notifications</NavLink>
					</div>
				</nav>

				<div className="pr-app-sidebar__footer">
					<OrgSwitcher />
				</div>
			</aside>

			<div className="pr-app-main">
				<header className="pr-app-header">
					<div className="pr-app-header__user">
						{user && (
							<>
								<span className="pr-app-header__name">{user.name}</span>
								<button onClick={logout} className="pr-app-btn pr-app-btn--text">
									Logout
								</button>
							</>
						)}
					</div>
				</header>

				<div className="pr-app-content">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
