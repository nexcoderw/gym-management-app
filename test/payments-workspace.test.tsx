// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
const showModalDescriptor = Object.getOwnPropertyDescriptor(
	HTMLDialogElement.prototype,
	'showModal',
);
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
		configurable: true,
		value(this: HTMLDialogElement) {
			this.open = true;
		},
	});
	Object.defineProperty(HTMLDialogElement.prototype, 'close', {
		configurable: true,
		value(this: HTMLDialogElement) {
			this.open = false;
		},
	});
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	if (showModalDescriptor)
		Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModalDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
	if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('payments ledger search', () => {
	it('searches payments through the backend after three characters', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
		fetchMock.mockResolvedValueOnce(Response.json({ items: [payment], nextCursor: null }));
		render(
			<PaymentsWorkspace
				initialItems={[payment]}
				initialNextCursor={null}
				initialErrorStatus={null}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Search payments' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'un' } });
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unknown' } });
		expect(await screen.findByRole('heading', { name: 'No matching payments' })).toBeTruthy();
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('search=unknown');

		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'example member' } });
		expect(
			await screen.findByRole('button', { name: `View payment ${payment.receiptNumber}` }),
		).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(String(fetchMock.mock.calls[1]?.[0])).toContain('search=example+member');
	});

	it('discards closed drafts and applies payment filters in one request', async () => {
		fetchMock.mockResolvedValue(Response.json({ items: [payment], nextCursor: null }));
		render(
			<PaymentsWorkspace
				initialItems={[payment]}
				initialNextCursor={null}
				initialErrorStatus={null}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		let sheet = screen.getByRole('dialog');
		expect(within(sheet).getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(
			true,
		);
		fireEvent.change(within(sheet).getByLabelText('Status'), { target: { value: 'CONFIRMED' } });
		fireEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		sheet = screen.getByRole('dialog');
		expect((within(sheet).getByLabelText('Status') as HTMLSelectElement).value).toBe('ALL');
		fireEvent.change(within(sheet).getByLabelText('Status'), { target: { value: 'CONFIRMED' } });
		fireEvent.change(within(sheet).getByLabelText('Order'), { target: { value: 'AMOUNT_HIGH' } });
		fireEvent.change(within(sheet).getByLabelText('Payments through'), {
			target: { value: '2030-01-01' },
		});
		fireEvent.change(within(sheet).getByLabelText('Payments from'), {
			target: { value: '2030-02-01' },
		});
		expect(within(sheet).getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(
			true,
		);
		fireEvent.change(within(sheet).getByLabelText('Payments from'), {
			target: { value: '2030-01-01' },
		});
		fireEvent.click(within(sheet).getByRole('button', { name: 'Apply' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
		const request = fetchMock.mock.calls[0]?.[0];
		expect(String(request)).toContain('status=CONFIRMED');
		expect(String(request)).toContain('order=AMOUNT_HIGH');
		expect(String(request)).toContain('fromDate=2030-01-01');
		expect(String(request)).toContain('toDate=2030-01-01');
	});
});
