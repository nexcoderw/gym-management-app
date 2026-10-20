import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMembersMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/endpoints/members/list-members', () => ({
	listMembers: listMembersMock,
}));

import { GET } from '@/app/api/members/route';
import { UpstreamError } from '@/lib/server/upstream';

const cursor = '22222222-2222-4222-8222-222222222222';
const syntheticCursor = '11ab9b64-19b3-ee0d-19c8-e2c69b0722da';

beforeEach(() => {
	listMembersMock.mockReset();
});

describe('members listing BFF', () => {
	it('forwards only validated list filters', async () => {
		listMembersMock.mockResolvedValueOnce({
			items: [],
			nextCursor: null,
		});

		const request = new Request(
			`https://manager.test/api/members?status=ARCHIVED&limit=20&cursor=${cursor}`,
		);

		const response = await GET(request);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');

		expect(listMembersMock).toHaveBeenCalledWith({
			status: 'ARCHIVED',
			limit: 20,
			cursor,
		});

		await expect(response.json()).resolves.toEqual({
			items: [],
			nextCursor: null,
		});
	});

	it('accepts a cursor returned from PostgreSQL for synthetic records', async () => {
		listMembersMock.mockResolvedValueOnce({ items: [], nextCursor: null });
		const response = await GET(
			new Request(`https://manager.test/api/members?cursor=${syntheticCursor}`),
		);
		expect(response.status).toBe(200);
		expect(listMembersMock).toHaveBeenCalledWith({
			status: 'ACTIVE',
			limit: 20,
			cursor: syntheticCursor,
		});
	});

	it.each([
		'?status=ALL',
		'?limit=0',
		'?limit=51',
		'?limit=abc',
		'?cursor=invalid',
		'?organizationId=11111111-1111-4111-8111-111111111111',
		'?status=ACTIVE&status=ARCHIVED',
	])('rejects invalid filters: %s', async (query) => {
		const request = new Request(`https://manager.test/api/members${query}`);
		const response = await GET(request);

		expect(response.status).toBe(400);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(listMembersMock).not.toHaveBeenCalled();
	});

	it('preserves a safe access denial', async () => {
		listMembersMock.mockRejectedValueOnce(new UpstreamError(403, 'This request is not allowed.'));

		const response = await GET(new Request('https://manager.test/api/members'));

		expect(response.status).toBe(403);
		expect(response.headers.get('cache-control')).toBe('no-store');

		await expect(response.json()).resolves.toEqual({
			message: 'This request is not allowed.',
		});
	});

	it('does not expose internal upstream failures', async () => {
		listMembersMock.mockRejectedValueOnce(new Error('private database connection details'));

		const response = await GET(new Request('https://manager.test/api/members'));

		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');

		const result = await response.text();

		expect(result).not.toContain('private database');
		expect(result).toContain('temporarily unavailable');
	});
});
