import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ csrf: true }));
vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		getAll: () => [{ name: 'nexcode-owner-session', value: 'fictional-session' }],
		get: () => (session.csrf ? { value: 'fictional-csrf' } : undefined),
	})),
	headers: vi.fn(async () => new Headers()),
}));

import { GET as listPayments, POST } from '@/app/api/payments/route';
import { GET as getPayment } from '@/app/api/payments/[paymentId]/route';
import { POST as registerPayment } from '@/app/api/payments/registrations/route';

const id = '11111111-1111-4111-8111-111111111111';
const syntheticId = 'ef9635e3-131b-08bb-b357-c2dbb0a4565e';
const date = '2030-01-01T00:00:00.000Z';
const payment = {
	id,
	receiptNumber: 'PAY-20300101-11111111',
	memberId: id,
	memberName: 'Example Member',
	amount: 30_000,
	currency: 'RWF',
	method: 'CASH',
	status: 'CONFIRMED',
	providerReference: null,
	note: null,
	occurredAt: date,
	confirmedAt: date,
	voidedAt: null,
	voidReason: null,
	createdAt: date,
	allocations: [
		{
			subscriptionId: id,
			planName: 'Monthly',
			amount: 30_000,
			startDate: '2030-01-01',
			endDate: '2030-01-31',
		},
	],
	refunds: [],
};
const input = {
	memberId: id,
	subscriptionId: id,
	amount: 30_000,
	method: 'CASH',
	occurredAt: date,
	providerReference: '',
	note: '',
	idempotencyKey: id,
};
const registrationInput = {
	member: { name: 'Example Member', phoneNumber: '+250700000001', email: '' },
	subscription: {
		membershipPlanId: id,
		startDate: '2030-01-01',
		periodUnit: 'MONTHS',
		periodCount: 1,
	},
	method: 'CASH',
	occurredAt: date,
	providerReference: '',
	note: '',
	idempotencyKey: id,
};
const fetchMock = vi.fn<typeof fetch>();

function post(body: unknown, origin = 'https://manager.test') {
	return new Request('https://manager.test/api/payments', {
		method: 'POST',
		headers: { Origin: origin, 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

beforeEach(() => {
	session.csrf = true;
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('payment BFF routes', () => {
	it('rejects foreign origins and missing CSRF before upstream work', async () => {
		expect((await POST(post(input, 'https://foreign.test'))).status).toBe(403);
		session.csrf = false;
		expect((await POST(post(input))).status).toBe(403);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects tenant injection, invalid amounts and duplicate filters', async () => {
		expect((await POST(post({ ...input, organizationId: id }))).status).toBe(400);
		expect((await POST(post({ ...input, amount: 0 }))).status).toBe(400);
		expect(
			(
				await listPayments(
					new Request('https://manager.test/api/payments?status=PENDING&status=CONFIRMED'),
				)
			).status,
		).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('lists with fixed, validated filters and no-store output', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [payment], nextCursor: null }));
		const result = await listPayments(
			new Request('https://manager.test/api/payments?status=CONFIRMED&order=NEWEST&limit=24'),
		);
		expect(result.status).toBe(200);
		expect(result.headers.get('cache-control')).toBe('no-store');
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'https://api.manager.test/api/v1/owner/payments?order=NEWEST&limit=24&status=CONFIRMED',
		);
	});

	it('accepts persisted PostgreSQL identifiers in payments and cursors', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [{ ...payment, id: syntheticId, memberId: syntheticId }],
				nextCursor: syntheticId,
			}),
		);
		const result = await listPayments(
			new Request(`https://manager.test/api/payments?order=NEWEST&limit=24&cursor=${syntheticId}`),
		);
		expect(result.status).toBe(200);
		expect(await result.json()).toMatchObject({ nextCursor: syntheticId });
	});

	it('forwards transaction date filters without search', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
		const result = await listPayments(
			new Request(
				'https://manager.test/api/payments?fromDate=2026-01-01&toDate=2026-10-19',
			),
		);
		expect(result.status).toBe(200);
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
			'fromDate=2026-01-01&toDate=2026-10-19',
		);
	});

	it('rejects a search parameter instead of forwarding it', async () => {
		const result = await listPayments(new Request('https://manager.test/api/payments?search=soho'));
		expect(result.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards only the payment DTO with an idempotency key', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(payment, { status: 201 }));
		const result = await POST(post(input));
		expect(result.status).toBe(201);
		expect(result.headers.get('cache-control')).toBe('no-store');
		const options = fetchMock.mock.calls[0]?.[1];
		expect(new Headers(options?.headers).get('Idempotency-Key')).toBe(id);
		expect(new Headers(options?.headers).get('x-owner-csrf-token')).toBe('fictional-csrf');
		expect(JSON.parse(String(options?.body))).toEqual({
			memberId: id,
			subscriptionId: id,
			amount: 30_000,
			method: 'CASH',
			occurredAt: date,
		});
	});

	it('accepts a synthetic member and subscription for a new payment', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ ...payment, id: syntheticId, memberId: syntheticId }, { status: 201 }),
		);
		const result = await POST(
			post({ ...input, memberId: syntheticId, subscriptionId: syntheticId }),
		);
		expect(result.status).toBe(201);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			memberId: syntheticId,
			subscriptionId: syntheticId,
		});
	});

	it('reads a payment only through its validated identifier', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(payment));
		const valid = await getPayment(new Request('https://manager.test/api/payments'), {
			params: Promise.resolve({ paymentId: id }),
		});
		expect(valid.status).toBe(200);
		const invalid = await getPayment(new Request('https://manager.test/api/payments'), {
			params: Promise.resolve({ paymentId: 'invalid' }),
		});
		expect(invalid.status).toBe(400);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('reads a payment with PostgreSQL UUID bits', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ ...payment, id: syntheticId }));
		const response = await getPayment(new Request('https://manager.test/api/payments'), {
			params: Promise.resolve({ paymentId: syntheticId }),
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ id: syntheticId });
	});

	it('rejects unsafe registration payments before reaching Nest', async () => {
		expect((await registerPayment(post(registrationInput, 'https://foreign.test'))).status).toBe(
			403,
		);
		session.csrf = false;
		expect((await registerPayment(post(registrationInput))).status).toBe(403);
		session.csrf = true;
		expect((await registerPayment(post({ ...registrationInput, organizationId: id }))).status).toBe(
			400,
		);
		expect((await registerPayment(post({ ...registrationInput, memberId: id }))).status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards only new registration fields and its idempotency key', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(payment, { status: 201 }));
		const result = await registerPayment(post(registrationInput));
		expect(result.status).toBe(201);
		expect(result.headers.get('cache-control')).toBe('no-store');
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'https://api.manager.test/api/v1/owner/payments/registrations',
		);
		const options = fetchMock.mock.calls[0]?.[1];
		expect(new Headers(options?.headers).get('Idempotency-Key')).toBe(id);
		expect(JSON.parse(String(options?.body))).toEqual({
			member: { name: 'Example Member', phoneNumber: '+250700000001' },
			subscription: registrationInput.subscription,
			method: 'CASH',
			occurredAt: date,
		});
	});

	it('accepts an already normalized optional member email', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(payment, { status: 201 }));
		const normalized = {
			...registrationInput,
			member: { ...registrationInput.member, email: null },
		};
		const result = await registerPayment(post(normalized));
		expect(result.status).toBe(201);
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
