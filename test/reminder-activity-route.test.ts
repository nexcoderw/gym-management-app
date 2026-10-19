import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		getAll: () => [{ name: 'nexcode-owner-session', value: 'fictional-session' }],
	})),
	headers: vi.fn(async () => new Headers()),
}));

import { GET } from '@/app/api/reminders/activity/route';

const id = '11111111-1111-4111-8111-111111111111';
const item = {
	id,
	memberId: '22222222-2222-4222-8222-222222222222',
	memberName: 'Example Member',
	planName: 'Monthly',
	kind: 'THREE_DAYS_BEFORE',
	status: 'ACCEPTED',
	dueDate: '2030-01-28',
	endDate: '2030-01-31',
	acceptedAt: '2030-01-28T08:00:00.000Z',
	deliveredAt: null,
};
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('reminder activity BFF route', () => {
	it('uses the fixed owner endpoint and returns a validated no-store feed', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [item] }));
		const response = await GET(new Request('https://manager.test/api/reminders/activity'));
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ items: [item] });
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'https://api.manager.test/api/v1/owner/reminders/activity?limit=50',
		);
		expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Origin')).toBe(
			'https://manager.test',
		);
	});

	it('rejects caller-selected query parameters before contacting Nest', async () => {
		const response = await GET(
			new Request('https://manager.test/api/reminders/activity?organizationId=other'),
		);
		expect(response.status).toBe(400);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects malformed upstream items without exposing their details', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ items: [{ ...item, recipientEmail: 'private@example.com' }] }),
		);
		const response = await GET(new Request('https://manager.test/api/reminders/activity'));
		expect(response.status).toBe(503);
		expect(JSON.stringify(await response.json())).not.toContain('private@example.com');
	});

	it('preserves Nest authentication and tenant denial statuses', async () => {
		for (const status of [401, 403]) {
			fetchMock.mockResolvedValueOnce(Response.json({ message: 'Access denied.' }, { status }));
			const response = await GET(new Request('https://manager.test/api/reminders/activity'));
			expect(response.status).toBe(status);
			expect(response.headers.get('cache-control')).toBe('no-store');
		}
	});
});
