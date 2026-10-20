import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ csrf: true }));
vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		getAll: () => [{ name: 'nexcode-owner-session', value: 'fictional-session' }],
		get: () => session.csrf ? { value: 'fictional-csrf' } : undefined,
	})),
	headers: vi.fn(async () => new Headers()),
}));

import { GET } from '@/app/api/reminders/upcoming/route';
import { POST } from '@/app/api/reminders/subscriptions/[subscriptionId]/deliveries/route';

const subscriptionId = '11111111-1111-4111-8111-111111111111';
const context = { params: Promise.resolve({ subscriptionId }) };
const fetchMock = vi.fn<typeof fetch>();
const message = { subject: 'Your membership ends soon', body: 'Hello, please renew.' };

beforeEach(() => {
	session.csrf = true;
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('upcoming reminder BFF routes', () => {
	it('forwards a bounded tenant-resolved list without caller-selected organization IDs', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
		const response = await GET(new Request('https://manager.test/api/reminders/upcoming'));
		expect(response.status).toBe(200);
		expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.manager.test/api/v1/owner/reminders/upcoming?limit=24');
		expect((await GET(new Request('https://manager.test/api/reminders/upcoming?organizationId=other'))).status).toBe(400);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('rejects a foreign browser origin and missing CSRF before contacting Nest', async () => {
		const foreign = new Request('https://manager.test/api/reminders/subscriptions/x/deliveries', { method: 'POST', headers: { Origin: 'https://foreign.test' } });
		expect((await POST(foreign, context)).status).toBe(403);
		session.csrf = false;
		const local = new Request('https://manager.test/api/reminders/subscriptions/x/deliveries', { method: 'POST', headers: { Origin: 'https://manager.test' } });
		expect((await POST(local, context)).status).toBe(403);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('queues against the fixed owner path with CSRF and no tenant ID in the browser request', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ id: subscriptionId, status: 'QUEUED' }, { status: 202 }));
		const request = new Request(`https://manager.test/api/reminders/subscriptions/${subscriptionId}/deliveries`, {
			method: 'POST',
			headers: { Origin: 'https://manager.test' },
			body: JSON.stringify(message),
		});
		const response = await POST(request, context);
		expect(response.status).toBe(202);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(`https://api.manager.test/api/v1/owner/reminders/subscriptions/${subscriptionId}/deliveries`);
		expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('x-owner-csrf-token')).toBe('fictional-csrf');
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(message);
	});

	it('rejects invalid email copy before contacting Nest', async () => {
		const invalid = new Request(`https://manager.test/api/reminders/subscriptions/${subscriptionId}/deliveries`, {
			method: 'POST',
			headers: { Origin: 'https://manager.test' },
			body: JSON.stringify({ ...message, subject: 'Invalid\nSubject' }),
		});
		expect((await POST(invalid, context)).status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
