import { useState } from 'react';
import { api } from '../api/client';
import type { OfferAvailability } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilityEditorProps {
	availabilities: OfferAvailability[];
	offerId: string;
}

interface DayRow {
	enabled: boolean;
	startTime: string;
	endTime: string;
}

export function AvailabilityEditor({ availabilities, offerId }: AvailabilityEditorProps) {
	const [rows, setRows] = useState<DayRow[]>(() =>
		DAYS.map((_, i) => {
			const existing = availabilities.find((a) => a.dayOfWeek === i);
			return {
				enabled: Boolean(existing),
				startTime: existing?.startTime?.slice(0, 5) || '09:00',
				endTime: existing?.endTime?.slice(0, 5) || '17:00',
			};
		})
	);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	const handleToggle = (index: number) => {
		setRows((prev) => prev.map((row, i) => (i === index ? { ...row, enabled: !row.enabled } : row)));
	};

	const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
		setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
	};

	const handleSave = async () => {
		setSaving(true);
		setMessage('');

		const newAvailabilities = rows
			.map((row, i) => ({
				dayOfWeek: i,
				startTime: row.startTime + ':00',
				endTime: row.endTime + ':00',
			}))
			.filter((_, i) => rows[i].enabled);

		try {
			await api.patch(`patron-raise/offers/${offerId}`, {
				availabilities: newAvailabilities,
			});
			setMessage('Availability saved.');
		} catch (err: any) {
			setMessage(`Error: ${err.message}`);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="pr-app-availability-editor">
			<div className="pr-app-availability-editor__rows">
				{DAYS.map((day, i) => (
					<div key={day} className="pr-app-availability-editor__row">
						<label className="pr-app-availability-editor__toggle">
							<input
								type="checkbox"
								checked={rows[i].enabled}
								onChange={() => handleToggle(i)}
							/>
							<span className="pr-app-availability-editor__day">{day}</span>
						</label>

						{rows[i].enabled && (
							<div className="pr-app-availability-editor__times">
								<input
									type="time"
									value={rows[i].startTime}
									onChange={(e) => handleTimeChange(i, 'startTime', e.target.value)}
								/>
								<span>to</span>
								<input
									type="time"
									value={rows[i].endTime}
									onChange={(e) => handleTimeChange(i, 'endTime', e.target.value)}
								/>
							</div>
						)}
					</div>
				))}
			</div>

			{message && (
				<div className={`pr-app-alert ${message.startsWith('Error') ? 'pr-app-alert--error' : 'pr-app-alert--success'}`}>
					{message}
				</div>
			)}

			<button
				onClick={handleSave}
				className="pr-app-btn pr-app-btn--primary"
				disabled={saving}
				style={{ marginTop: '1rem' }}
			>
				{saving ? 'Saving...' : 'Save Availability'}
			</button>
		</div>
	);
}
