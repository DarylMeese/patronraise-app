import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Host pages.
import { HostDashboard } from './pages/host/Dashboard';
import { OfferList } from './pages/host/OfferList';
import { OfferEditor } from './pages/host/OfferEditor';
import { AvailabilityManager } from './pages/host/AvailabilityManager';
import { PendingRequests } from './pages/host/PendingRequests';
import { HostUpcomingEvents } from './pages/host/UpcomingEvents';
import { EventReport } from './pages/host/EventReport';

// Beneficiary pages.
import { BeneficiaryDashboard } from './pages/beneficiary/Dashboard';
import { SearchHosts } from './pages/beneficiary/SearchHosts';
import { RequestWizard } from './pages/beneficiary/RequestWizard';
import { MyRequests } from './pages/beneficiary/MyRequests';
import { BeneficiaryUpcomingEvents } from './pages/beneficiary/UpcomingEvents';

// Notifications.
import { NotificationCenter } from './pages/notifications/NotificationCenter';

import './styles/app.css';

export function App() {
	return (
		<HashRouter>
			<AuthProvider>
				<Routes>
					{/* Public routes */}
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />

					{/* Protected routes with layout */}
					<Route
						element={
							<ProtectedRoute>
								<Layout />
							</ProtectedRoute>
						}
					>
						{/* Host routes */}
						<Route path="/host" element={<HostDashboard />} />
						<Route path="/host/offers" element={<OfferList />} />
						<Route path="/host/offers/new" element={<OfferEditor />} />
						<Route path="/host/offers/:publicUid" element={<OfferEditor />} />
						<Route path="/host/offers/:publicUid/availability" element={<AvailabilityManager />} />
						<Route path="/host/requests" element={<PendingRequests />} />
						<Route path="/host/events" element={<HostUpcomingEvents />} />
						<Route path="/host/events/:eventId/report" element={<EventReport />} />

						{/* Beneficiary routes */}
						<Route path="/beneficiary" element={<BeneficiaryDashboard />} />
						<Route path="/beneficiary/search" element={<SearchHosts />} />
						<Route path="/beneficiary/request/:offerUid" element={<RequestWizard />} />
						<Route path="/beneficiary/requests" element={<MyRequests />} />
						<Route path="/beneficiary/events" element={<BeneficiaryUpcomingEvents />} />

						{/* Notifications */}
						<Route path="/notifications" element={<NotificationCenter />} />
					</Route>

					{/* Default redirect */}
					<Route path="*" element={<Navigate to="/host" replace />} />
				</Routes>
			</AuthProvider>
		</HashRouter>
	);
}
