// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentsWorkspace } from '@/components/payments/payments-workspace';
import type { Payment } from '@/lib/contracts';

const payment: Payment = {
	id: '11111111-1111-4111-8111-111111111111',
	receiptNumber: 'PAY-20300101-11111111',
	memberId: '22222222-2222-4222-8222-222222222222',
	memberName: 'Example Member',
	amount: 30_000,
	currency: 'RWF',
	method: 'CASH',
	status: 'CONFIRMED',
	providerReference: null,
	note: null,
	occurredAt: '2030-01-01T08:00:00.000Z',
	confirmedAt: '2030-01-01T08:00:00.000Z',
	voidedAt: null,
	voidReason: null,
	createdAt: '2030-01-01T08:00:00.000Z',
	allocations: [
		{
			subscriptionId: '33333333-3333-4333-8333-333333333333',
			planName: 'Monthly',
			amount: 30_000,
			startDate: '2030-01-01',
			endDate: '2030-01-31',
		},
	],
	refunds: [],
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('payments ledger search', () => {
	it('filters loaded payments without requesting another page', () => {
		render(
			<PaymentsWorkspace
				initialItems={[payment]}
				initialNextCursor={null}
				initialErrorStatus={null}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Search loaded payments' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unknown' } });
		expect(screen.getByRole('heading', { name: 'No matching payments' })).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'example member' } });
		expect(screen.getByRole('button', { name: `View payment ${payment.receiptNumber}` })).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
