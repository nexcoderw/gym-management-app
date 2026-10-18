import 'server-only';

import { z } from 'zod';

import { membershipPlanListSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

const filtersSchema = z.object({
	status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).default('ALL'),
	limit: z.number().int().min(1).max(50).default(50),
	cursor: z.uuid().optional(),
});

export async function listMembershipPlans(
	filters: {
		readonly status?: 'ACTIVE' | 'ARCHIVED' | 'ALL';
		readonly limit?: number;
		readonly cursor?: string;
	} = {},
) {
	const parsed = filtersSchema.parse(filters);
	const query = new URLSearchParams({
		status: parsed.status,
		limit: String(parsed.limit),
	});
	if (parsed.cursor !== undefined) query.set('cursor', parsed.cursor);
	return (
		await upstreamJson(`/owner/membership-plans?${query.toString()}`, {}, membershipPlanListSchema)
	).data;
}
