import 'server-only';

import { z } from 'zod';

import { databaseIdSchema, membershipPlanListSchema, membershipPlanOrderSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

const filtersSchema = z.strictObject({
	status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).default('ACTIVE'),
	order: membershipPlanOrderSchema.default('PRICE_ASC'),
	limit: z.number().int().min(1).max(24).default(24),
	cursor: databaseIdSchema.optional(),
});

export async function listMembershipPlans(
	filters: {
		readonly status?: 'ACTIVE' | 'ARCHIVED' | 'ALL';
		readonly limit?: number;
		readonly order?: z.infer<typeof membershipPlanOrderSchema>;
		readonly cursor?: string;
	} = {},
) {
	const parsed = filtersSchema.parse(filters);
	const query = new URLSearchParams({
		status: parsed.status,
		order: parsed.order,
		limit: String(parsed.limit),
	});
	if (parsed.cursor !== undefined) query.set('cursor', parsed.cursor);
	return (
		await upstreamJson(`/owner/membership-plans?${query.toString()}`, {}, membershipPlanListSchema)
	).data;
}
