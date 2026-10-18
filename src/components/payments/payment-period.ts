import type { MemberPeriodUnit } from '@/lib/contracts';

/** Preview only; Nest calculates and stores the authoritative inclusive end date. */
export function paymentEndDate(
	start: string,
	unit: MemberPeriodUnit,
	count: number,
): string | null {
	if (!/^20\d{2}-\d{2}-\d{2}$/u.test(start)) return null;
	const startDate = new Date(`${start}T00:00:00.000Z`);
	if (!Number.isFinite(startDate.getTime()) || startDate.toISOString().slice(0, 10) !== start) {
		return null;
	}
	const limits: Record<MemberPeriodUnit, number> = {
		DAYS: 3650,
		WEEKS: 520,
		MONTHS: 120,
		YEARS: 10,
	};
	if (!Number.isInteger(count) || count < 1 || count > limits[unit]) return null;
	const boundary = new Date(startDate);
	if (unit === 'DAYS' || unit === 'WEEKS') {
		boundary.setUTCDate(boundary.getUTCDate() + count * (unit === 'WEEKS' ? 7 : 1));
	} else {
		const day = boundary.getUTCDate();
		boundary.setUTCDate(1);
		boundary.setUTCMonth(boundary.getUTCMonth() + count * (unit === 'YEARS' ? 12 : 1));
		const lastDay = new Date(Date.UTC(boundary.getUTCFullYear(), boundary.getUTCMonth() + 1, 0));
		boundary.setUTCDate(Math.min(day, lastDay.getUTCDate()));
	}
	boundary.setUTCDate(boundary.getUTCDate() - 1);
	return boundary.toISOString().slice(0, 10);
}
