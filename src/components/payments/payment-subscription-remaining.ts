const millisecondsPerDay = 86_400_000;

interface SubscriptionCountdown {
	readonly label: string;
	readonly tone: 'scheduled' | 'healthy' | 'soon' | 'urgent' | 'expired';
}

export function kigaliCalendarDate(instant: Date): string {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Africa/Kigali',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(instant);
	const value = (part: 'year' | 'month' | 'day') =>
		parts.find((item) => item.type === part)?.value ?? '';
	return `${value('year')}-${value('month')}-${value('day')}`;
}

export function subscriptionCountdown(
	startDate: string,
	endDate: string,
	today: string,
): SubscriptionCountdown {
	const dayNumber = (date: string) => Date.parse(`${date}T00:00:00.000Z`) / millisecondsPerDay;
	const untilStart = dayNumber(startDate) - dayNumber(today);
	if (untilStart > 0) {
		return {
			label: `Starts in ${untilStart} day${untilStart === 1 ? '' : 's'}`,
			tone: 'scheduled',
		};
	}

	const remaining = dayNumber(endDate) - dayNumber(today);
	if (remaining < 0) return { label: 'Expired', tone: 'expired' };
	return {
		label: `${remaining} day${remaining === 1 ? '' : 's'} left`,
		tone: remaining <= 3 ? 'urgent' : remaining <= 14 ? 'soon' : 'healthy',
	};
}
