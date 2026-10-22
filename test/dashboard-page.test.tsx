// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/session', () => ({
	requireOwnerPortalSession: vi.fn(async () => ({ organization: { name: 'Example Gym' } })),
}));
vi.mock('@/lib/server/endpoints/dashboard/get-dashboard-analytics', () => ({
	getDashboardAnalytics: vi.fn(),
}));

import DashboardPage from '@/app/(portal)/dashboard/page';
import { getDashboardAnalytics } from '@/lib/server/endpoints/dashboard/get-dashboard-analytics';
import { UpstreamError } from '@/lib/server/upstream';

const getAnalytics = vi.mocked(getDashboardAnalytics);
const analytics = {
	period: {
		fromDate: '2026-10-01',
		toDate: '2026-10-20',
		comparisonFromDate: '2026-09-11',
		comparisonToDate: '2026-09-30',
		timeZone: 'Africa/Kigali' as const,
		revenueBucket: 'DAY' as const,
	},
	currency: 'RWF' as const,
	metrics: {
		netCollected: {
			currentRwf: '15000',
			previousRwf: '10000',
			change: { direction: 'UP' as const, percent: 50 },
		},
		settledPayments: {
			current: 1,
			previous: 1,
			change: { direction: 'UNCHANGED' as const, percent: 0 },
		},
		newMembers: { current: 2, previous: 0, change: { direction: 'NEW' as const, percent: null } },
		activeSubscribers: {
			current: 3,
			previous: 2,
			change: { direction: 'UP' as const, percent: 50 },
		},
	},
	revenueSeries: [
		{
			fromDate: '2026-10-01',
			toDate: '2026-10-01',
			grossRwf: '15000',
			refundedRwf: '0',
			netRwf: '15000',
		},
	],
	planTotals: [
		{ planId: '33333333-3333-4333-8333-333333333333', planName: 'Gold', grossRwf: '15000' },
	],
	methodTotals: [{ method: 'CASH' as const, settledPaymentCount: 1, grossRwf: '15000' }],
	generatedAt: '2026-10-20T12:00:00.000Z',
};

beforeEach(() => getAnalytics.mockReset());
afterEach(() => cleanup());

describe('owner dashboard page', () => {
	it('loads the current month by default and shows backend values', async () => {
		getAnalytics.mockResolvedValueOnce(analytics);
		render(await DashboardPage({ searchParams: Promise.resolve({}) }));
		expect(getAnalytics).toHaveBeenCalledWith({});
		expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
		expect(screen.getByRole('heading', { name: /15,000/u })).toBeTruthy();
		expect(
			screen.getByRole('img', { name: 'Net revenue trend across the selected dates' }),
		).toBeTruthy();
		expect(screen.getByText('Gold')).toBeTruthy();
		expect(screen.queryByText('DEMO DATA')).toBeNull();
	});

	it('passes paired dates to the backend adapter', async () => {
		getAnalytics.mockResolvedValueOnce(analytics);
		render(
			await DashboardPage({
				searchParams: Promise.resolve({ fromDate: '2026-10-01', toDate: '2026-10-20' }),
			}),
		);
		expect(getAnalytics).toHaveBeenCalledWith({ fromDate: '2026-10-01', toDate: '2026-10-20' });
	});

	it('rejects invalid dates without an upstream request', async () => {
		render(await DashboardPage({ searchParams: Promise.resolve({ fromDate: '2026-10-20' }) }));
		expect(screen.getByRole('alert').textContent).toContain('valid start and end date');
		expect(getAnalytics).not.toHaveBeenCalled();
	});

	it('keeps failures distinct from genuine zero revenue', async () => {
		getAnalytics.mockRejectedValueOnce(new UpstreamError(503, 'Unavailable'));
		render(await DashboardPage({ searchParams: Promise.resolve({}) }));
		expect(screen.getByRole('alert').textContent).toContain('could not be loaded');
		expect(screen.queryByText('Net collected')).toBeNull();
	});
});
