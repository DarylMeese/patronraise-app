import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { AvailabilityDay } from '../types';

interface CalendarProps {
	offerId: string;
	onDateSelect?: (date: string) => void;
}

export function Calendar({ offerId, onDateSelect }: CalendarProps) {
	const [year, setYear] = useState(() => new Date().getFullYear());
	const [month, setMonth] = useState(() => new Date().getMonth());
	const [days, setDays] = useState<AvailabilityDay[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setLoading(true);

		const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
		const lastDay = new Date(year, month + 1, 0).getDate();
		const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

		api.get<{ days: AvailabilityDay[] }>(`patron-raise/offers/${offerId}/availability?start=${start}&end=${end}`)
			.then((data) => setDays(data.days || []))
			.catch(() => setDays([]))
			.finally(() => setLoading(false));
	}, [offerId, year, month]);

	const prevMonth = () => {
		if (month === 0) {
			setMonth(11);
			setYear((y) => y - 1);
		} else {
			setMonth((m) => m - 1);
		}
	};

	const nextMonth = () => {
		if (month === 11) {
			setMonth(0);
			setYear((y) => y + 1);
		} else {
			setMonth((m) => m + 1);
		}
	};

	const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

	// Build calendar grid.
	const firstDayOfWeek = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const dayMap = new Map(days.map((d) => [d.date, d]));

	const cells: (AvailabilityDay | null)[] = [];
	for (let i = 0; i < firstDayOfWeek; i++) {
		cells.push(null);
	}
	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		cells.push(dayMap.get(dateStr) || { date: dateStr, status: 'closed', slots: [] });
	}

	return (
		<div className="pr-app-calendar">
			<div className="pr-app-calendar__header">
				<button onClick={prevMonth} className="pr-app-btn pr-app-btn--sm pr-app-btn--secondary">&laquo;</button>
				<h3 className="pr-app-calendar__title">{monthName}</h3>
				<button onClick={nextMonth} className="pr-app-btn pr-app-btn--sm pr-app-btn--secondary">&raquo;</button>
			</div>

			{loading ? (
				<p className="pr-app-text-muted">Loading calendar...</p>
			) : (
				<div className="pr-app-calendar__grid">
					{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
						<div key={d} className="pr-app-calendar__day-label">{d}</div>
					))}

					{cells.map((cell, i) => {
						if (!cell) {
							return <div key={`empty-${i}`} className="pr-app-calendar__cell pr-app-calendar__cell--empty" />;
						}

						const dayNum = parseInt(cell.date.split('-')[2], 10);
						const isOpen = cell.status === 'open' && cell.slots.length > 0;
						const isPast = new Date(cell.date) < new Date(new Date().toDateString());

						return (
							<button
								key={cell.date}
								className={[
									'pr-app-calendar__cell',
									isOpen ? 'pr-app-calendar__cell--available' : 'pr-app-calendar__cell--unavailable',
									isPast ? 'pr-app-calendar__cell--past' : '',
								].join(' ')}
								onClick={() => isOpen && !isPast && onDateSelect?.(cell.date)}
								disabled={!isOpen || isPast || !onDateSelect}
								type="button"
							>
								<span className="pr-app-calendar__day-num">{dayNum}</span>
								{isOpen && !isPast && (
									<span className="pr-app-calendar__slot-count">
										{cell.slots.length} slot{cell.slots.length !== 1 ? 's' : ''}
									</span>
								)}
							</button>
						);
					})}
				</div>
			)}

			<div className="pr-app-calendar__legend">
				<span className="pr-app-calendar__legend-item">
					<span className="pr-app-calendar__legend-dot pr-app-calendar__legend-dot--available" /> Available
				</span>
				<span className="pr-app-calendar__legend-item">
					<span className="pr-app-calendar__legend-dot pr-app-calendar__legend-dot--unavailable" /> Unavailable
				</span>
			</div>
		</div>
	);
}
