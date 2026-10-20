import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		getAll: () => [{ name: 'nexcode-owner-session', value: 'fictional-session' }],
	})),
	headers: vi.fn(async () => new Headers()),
}));

import { GET as getPdf } from '@/app/api/reports/payments/pdf/route';
import { GET as getSummary } from '@/app/api/reports/payments/summary/route';

const fetchMock = vi.fn<typeof fetch>();
const query = 'fromDate=2026-01-01&toDate=2026-01-31';
const summary = {
	fromDate: '2026-01-01',
	toDate: '2026-01-31',
	currency: 'RWF',
	paymentCount: 2,
	settledPaymentCount: 1,
	grossRwf: '15000',
	refundedRwf: '0',
	netRwf: '15000',
	planTotals: [
		{
			planId: '33333333-3333-4333-8333-333333333333',
			planName: 'Gold Plan',
			grossRwf: '15000',
		},
	],
	generatedAt: '2026-02-01T00:00:00.000Z',
};

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('payment report BFF routes', () => {
	it('rejects missing, reversed, invalid and injected dates before upstream work', async () => {
		for (const suffix of [
			'fromDate=2026-01-01',
			'fromDate=2026-02-01&toDate=2026-01-01',
			'fromDate=2026-02-30&toDate=2026-03-01',
			`${query}&organizationId=11111111-1111-4111-8111-111111111111`,
			`${query}&fromDate=2026-01-02`,
		]) {
			const request = new Request(`https://manager.test/api/reports/payments/summary?${suffix}`);
			expect((await getSummary(request)).status).toBe(400);
			expect((await getPdf(request)).status).toBe(400);
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns a validated summary without caching', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(summary));
		const response = await getSummary(
			new Request(`https://manager.test/api/reports/payments/summary?${query}`),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		await expect(response.json()).resolves.toEqual(summary);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			`https://api.manager.test/api/v1/owner/reports/payments/summary?${query}`,
		);
		const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
		expect(headers.get('cookie')).toBe('nexcode-owner-session=fictional-session');
	});

	it('rejects malformed upstream summary data', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ ...summary, netRwf: -1 }));
		const response = await getSummary(
			new Request(`https://manager.test/api/reports/payments/summary?${query}`),
		);
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});

	it('rejects invalid plan totals before showing the report', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ ...summary, planTotals: [{ ...summary.planTotals[0], grossRwf: '-1' }] }),
		);
		const response = await getSummary(
			new Request(`https://manager.test/api/reports/payments/summary?${query}`),
		);
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});

	it('downloads the full PDF with a fixed safe filename', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(new TextEncoder().encode('%PDF-1.7\nfictional-report'), {
				headers: { 'Content-Type': 'application/pdf' },
			}),
		);
		const response = await getPdf(
			new Request(`https://manager.test/api/reports/payments/pdf?${query}`),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/pdf');
		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="payments-2026-01-01-to-2026-01-31.pdf"',
		);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.text()).toContain('%PDF-1.7');
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			`https://api.manager.test/api/v1/owner/reports/payments/pdf?${query}`,
		);
		expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('accept')).toBe(
			'application/pdf',
		);
	});

	it('rejects an incompatible PDF response and preserves export size failures', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response('<html>not a PDF</html>', {
				headers: { 'Content-Type': 'text/html' },
			}),
		);
		const request = new Request(`https://manager.test/api/reports/payments/pdf?${query}`);
		expect((await getPdf(request)).status).toBe(503);
		fetchMock.mockResolvedValueOnce(
			Response.json(
				{ message: 'Choose a shorter date range for the PDF export.' },
				{ status: 413 },
			),
		);
		expect((await getPdf(request)).status).toBe(413);
	});
});
