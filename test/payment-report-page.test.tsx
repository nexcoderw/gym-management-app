// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/session', () => ({ requireOwnerPortalSession: vi.fn(async () => ({})) }));
vi.mock('@/lib/server/endpoints/reports/get-payment-report-summary', () => ({
	getPaymentReportSummary: vi.fn(),
}));

import ReportPage from '@/app/(portal)/report/page';
import { getPaymentReportSummary } from '@/lib/server/endpoints/reports/get-payment-report-summary';
import { UpstreamError } from '@/lib/server/upstream';

const summary = {
	fromDate: '2026-01-01',
	toDate: '2026-01-31',
	currency: 'RWF' as const,
	paymentCount: 4,
	settledPaymentCount: 3,
	grossRwf: '45000',
	refundedRwf: '5000',
	netRwf: '40000',
	generatedAt: '2026-02-01T08:00:00.000Z',
};
const getSummary = vi.mocked(getPaymentReportSummary);

beforeEach(() => getSummary.mockReset());

describe('payment report page', () => {
	it('asks for dates before requesting financial data', async () => {
		render(await ReportPage({ searchParams: Promise.resolve({}) }));
		expect(screen.getByRole('heading', { name: 'Payment report' })).toBeTruthy();
		expect(screen.getByLabelText('From date')).toBeTruthy();
		expect(screen.getByLabelText('To date')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Generate report' })).toBeTruthy();
		expect(getSummary).not.toHaveBeenCalled();
	});

	it('shows validated totals and enables the full PDF download', async () => {
		getSummary.mockResolvedValueOnce(summary);
		render(
			await ReportPage({
				searchParams: Promise.resolve({ fromDate: '2026-01-01', toDate: '2026-01-31' }),
			}),
		);
		expect(getSummary).toHaveBeenCalledWith({ fromDate: '2026-01-01', toDate: '2026-01-31' });
		expect(screen.getByText('Net received')).toBeTruthy();
		expect(screen.getByText(`${new Intl.NumberFormat('en-RW').format(40_000)} RWF`)).toBeTruthy();
		expect(screen.getByText(`${new Intl.NumberFormat('en-RW').format(45_000)} RWF`)).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Download full PDF' })).toBeTruthy();
	});

	it('rejects invalid ranges without an upstream request', async () => {
		render(
			await ReportPage({
				searchParams: Promise.resolve({ fromDate: '2026-02-01', toDate: '2026-01-01' }),
			}),
		);
		expect(screen.getByRole('alert').textContent).toContain('End date must be on or after');
		expect(getSummary).not.toHaveBeenCalled();
		expect(screen.queryByText('Net received')).toBeNull();
	});

	it('shows a genuine zero only after a successful report response', async () => {
		getSummary.mockResolvedValueOnce({
			...summary,
			paymentCount: 0,
			settledPaymentCount: 0,
			grossRwf: '0',
			refundedRwf: '0',
			netRwf: '0',
		});
		render(
			await ReportPage({
				searchParams: Promise.resolve({ fromDate: '2026-01-01', toDate: '2026-01-31' }),
			}),
		);
		expect(screen.getByText('Net received')).toBeTruthy();
		expect(screen.getAllByText('0 RWF')).toHaveLength(3);
	});

	it('does not replace an unavailable report with invented zeroes', async () => {
		getSummary.mockRejectedValueOnce(new UpstreamError(503, 'Unavailable'));
		render(
			await ReportPage({
				searchParams: Promise.resolve({ fromDate: '2026-01-01', toDate: '2026-01-31' }),
			}),
		);
		expect(screen.getByRole('alert').textContent).toContain('could not be loaded');
		expect(screen.queryByText('Net received')).toBeNull();
		expect(screen.queryByRole('button', { name: 'Download full PDF' })).toBeNull();
	});
});
