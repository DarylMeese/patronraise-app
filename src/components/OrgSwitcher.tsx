import { useAuth } from '../context/AuthContext';

export function OrgSwitcher() {
	const { activeOrganizationId, switchOrganization } = useAuth();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		switchOrganization(e.target.value);
	};

	return (
		<div className="pr-app-org-switcher">
			<label htmlFor="org-id-input" className="pr-app-org-switcher__label">
				Organization ID
			</label>
			<input
				id="org-id-input"
				type="text"
				value={activeOrganizationId || ''}
				onChange={handleChange}
				placeholder="Enter organization UUID"
				className="pr-app-org-switcher__input"
			/>
		</div>
	);
}
