/**
 * Notification Center — Stub
 *
 * Full implementation blocked until the platform API exposes
 * notification listing/read/unread HTTP endpoints.
 */

export function NotificationCenter() {
	return (
		<div className="pr-app-page">
			<h1>Notifications</h1>

			<div className="pr-app-empty">
				<p>No notifications at this time.</p>
				<p className="pr-app-text-muted">
					Notifications for partnership requests, approvals, and reminders will appear here.
				</p>
			</div>
		</div>
	);
}
