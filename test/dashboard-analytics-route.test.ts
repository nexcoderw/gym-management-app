import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		getAll: () => [{ name: 'nexcode-owner-session', value: 'fictional-session' }],
	})),
	headers: vi.fn(async () => new Headers()),
}));

import { GET } from '@/app/api/dashboard/analytics/route';

const fetchMock = vi.fn<typeof fetch>();
const query = 'fromDate=2026-10-01&toDate=2026-10-20';
const analytics = {
	period: {
		fromDate: '2026-10-01',
		toDate: '2026-10-20',
		comparisonFromDate: '2026-09-11',
		comparisonToDate: '2026-09-30',
		timeZone: 'Africa/Kigali',
		revenueBucket: 'DAY',
	},
	currency: 'RWF',
	metrics: {
		netCollected: {
			currentRwf: '15000',
			previousRwf: '10000',
			change: { direction: 'UP', percent: 50 },
		},
		settledPayments: { current: 1, previous: 1, change: { direction: 'UNCHANGED', percent: 0 } },
		newMembers: { current: 2, previous: 0, change: { direction: 'NEW', percent: null } },
		activeSubscribers: { current: 3, previous: 2, change: { direction: 'UP', percent: 50 } },
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
	methodTotals: [{ method: 'CASH', settledPaymentCount: 1, grossRwf: '15000' }],
	generatedAt: '2026-10-20T12:00:00.000Z',
};

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('dashboard analytics BFF', () => {
	it('rejects unpaired, reversed, malformed and tenant-selected queries', async () => {
		for (const suffix of [
			'fromDate=2026-10-01',
			'fromDate=2026-10-20&toDate=2026-10-01',
			'fromDate=2026-02-30&toDate=2026-03-01',
			`${query}&organizationId=11111111-1111-4111-8111-111111111111`,
			`${query}&fromDate=2026-10-02`,
		]) {
			expect(
				(await GET(new Request(`https://manager.test/api/dashboard/analytics?${suffix}`))).status,
			).toBe(400);
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards validated dates and returns a no-store response', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(analytics));
		const response = await GET(
			new Request(`https://manager.test/api/dashboard/analytics?${query}`),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		await expect(response.json()).resolves.toEqual(analytics);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			`https://api.manager.test/api/v1/owner/dashboard/analytics?${query}`,
		);
	});

	it('uses the backend default month without browser dates', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(analytics));
		const response = await GET(new Request('https://manager.test/api/dashboard/analytics'));
		expect(response.status).toBe(200);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'https://api.manager.test/api/v1/owner/dashboard/analytics',
		);
	});

	it('does not display malformed upstream analytics', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				...analytics,
				metrics: {
					...analytics.metrics,
					netCollected: { ...analytics.metrics.netCollected, currentRwf: '-1' },
				},
			}),
		);
		const response = await GET(new Request('https://manager.test/api/dashboard/analytics'));
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});
});
