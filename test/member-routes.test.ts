import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ csrf: true }));
vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		getAll: () => [{ name: 'nexcode-owner-session', value: 'fictional-session' }],
		get: () => (session.csrf ? { value: 'fictional-csrf' } : undefined),
	})),
	headers: vi.fn(async () => new Headers()),
}));

import { POST } from '@/app/api/members/route';
import { DELETE, GET, PATCH } from '@/app/api/members/[memberId]/route';

const id = '11111111-1111-4111-8111-111111111111';
const date = '2030-01-01T00:00:00.000Z';
const member = {
	id,
	name: 'Example Member',
	phoneNumber: '+250700000001',
	email: null,
	status: 'ACTIVE',
	createdAt: date,
	updatedAt: date,
	archivedAt: null,
};
const context = { params: Promise.resolve({ memberId: id }) };
const fetchMock = vi.fn<typeof fetch>();
const profile = { name: 'Example Member', phoneNumber: '0700000001', email: '' };
const registration = {
	...profile,
	idempotencyKey: id,
	subscription: {
		membershipPlanId: id,
		startDate: '2030-01-01',
		periodUnit: 'MONTHS',
		periodCount: 1,
	},
};

function request(method: string, body: unknown, origin = 'https://manager.test') {
	return new Request(`https://manager.test/api/members/${id}`, {
		method,
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

describe('member BFF operations', () => {
	it('rejects foreign Origin and missing CSRF before contacting Nest', async () => {
		expect((await POST(request('POST', registration, 'https://foreign.test'))).status).toBe(403);
		session.csrf = false;
		expect((await PATCH(request('PATCH', { ...profile, updatedAt: date }), context)).status).toBe(
			403,
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects tenant injection, missing keys and invalid member identifiers', async () => {
		expect((await POST(request('POST', { ...registration, organizationId: id }))).status).toBe(400);
		expect((await POST(request('POST', { ...registration, idempotencyKey: '' }))).status).toBe(400);
		expect(
			(
				await GET(new Request('https://manager.test'), {
					params: Promise.resolve({ memberId: 'invalid' }),
				})
			).status,
		).toBe(400);
		expect(
			(await PATCH(request('PATCH', { ...profile, organizationId: id, updatedAt: date }), context))
				.status,
		).toBe(400);
		expect((await DELETE(request('DELETE', {}), context)).status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('preserves backend session rejection without exposing its response body', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ private: 'hidden session detail' }, { status: 401 }),
		);
		const response = await GET(new Request('https://manager.test'), context);
		expect(response.status).toBe(401);
		expect(await response.text()).not.toContain('hidden session detail');
	});

	it('registers using only the fixed path, allowlisted body and idempotency header', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json(
				{
					member,
					subscription: {
						id,
						memberId: id,
						membershipPlanId: id,
						planName: 'Monthly',
						price: 30000,
						currency: 'RWF',
						periodUnit: 'MONTHS',
						periodCount: 1,
						startDate: '2030-01-01',
						endDate: '2030-01-31',
						status: 'SCHEDULED',
						createdAt: date,
						cancelledAt: null,
					},
				},
				{ status: 201 },
			),
		);
		const response = await POST(request('POST', registration));
		expect(response.status).toBe(201);
		expect(response.headers.get('cache-control')).toBe('no-store');
		const call = fetchMock.mock.calls[0];
		expect(call?.[0]).toBe('https://api.manager.test/api/v1/owner/members');
		const headers = new Headers(call?.[1]?.headers);
		expect(headers.get('Idempotency-Key')).toBe(id);
		expect(headers.get('x-owner-csrf-token')).toBe('fictional-csrf');
		expect(call?.[1]?.body).not.toContain('idempotencyKey');
	});

	it('reads details and forwards the edit version without changing tenant context', async () => {
		fetchMock.mockResolvedValue(Response.json(member));
		expect((await GET(new Request('https://manager.test'), context)).status).toBe(200);
		expect((await PATCH(request('PATCH', { ...profile, updatedAt: date }), context)).status).toBe(
			200,
		);
		const options = fetchMock.mock.calls[1]?.[1];
		expect(new Headers(options?.headers).get('If-Match')).toBe(`"${date}"`);
		expect(JSON.parse(String(options?.body))).toEqual({
			name: profile.name,
			phoneNumber: profile.phoneNumber,
			email: null,
		});
	});

	it('archives with a precondition and preserves safe conflict and stale statuses', async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
		const response = await DELETE(request('DELETE', { updatedAt: date }), context);
		expect(response.status).toBe(204);
		expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('If-Match')).toBe(`"${date}"`);
		fetchMock.mockResolvedValueOnce(Response.json({ private: 'do not expose' }, { status: 409 }));
		expect((await DELETE(request('DELETE', { updatedAt: date }), context)).status).toBe(409);
		fetchMock.mockResolvedValueOnce(Response.json({}, { status: 412 }));
		expect((await PATCH(request('PATCH', { ...profile, updatedAt: date }), context)).status).toBe(
			412,
		);
	});
});
