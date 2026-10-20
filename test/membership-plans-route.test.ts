import { beforeEach, describe, expect, it, vi } from 'vitest';

const listPlans = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/endpoints/membership-plans/list-membership-plans', () => ({
	listMembershipPlans: listPlans,
}));

import { GET } from '@/app/api/membership-plans/route';

beforeEach(() => {
	listPlans.mockReset();
});

describe('membership plan listing BFF', () => {
	it('forwards bounded search, status and ordering', async () => {
		listPlans.mockResolvedValueOnce({ items: [], nextCursor: null });
		const response = await GET(
			new Request(
				'https://manager.test/api/membership-plans?status=ARCHIVED&order=PRICE_DESC&search=bronze&limit=24',
			),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(listPlans).toHaveBeenCalledWith({
			status: 'ARCHIVED',
			order: 'PRICE_DESC',
			search: 'bronze',
			limit: 24,
		});
	});

	it.each(['?limit=25', '?order=UNKNOWN', '?search=x&search=y', '?organizationId=other'])(
		'rejects invalid query %s',
		async (query) => {
			const response = await GET(
				new Request(`https://manager.test/api/membership-plans${query}`),
			);
			expect(response.status).toBe(400);
			expect(listPlans).not.toHaveBeenCalled();
		},
	);
});
