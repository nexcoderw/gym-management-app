import 'server-only';

import { z, ZodError } from 'zod';

import { databaseIdSchema, listDateSchema, memberListSchema, memberOrderSchema, memberStatusSchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

const filtersSchema = z.strictObject({
	status: memberStatusSchema.default('ACTIVE'),
	order: memberOrderSchema.default('NEWEST'),
	search: z.string().max(80).optional(),
	fromDate: listDateSchema.optional(),
	toDate: listDateSchema.optional(),
	limit: z.number().int().min(1).max(24).default(24),
	cursor: databaseIdSchema.optional(),
});

export type MemberListFilters = z.input<typeof filtersSchema>;

export async function listMembers(filters: MemberListFilters = {}) {
	const parsed = filtersSchema.parse(filters);

	const query = new URLSearchParams({
		status: parsed.status,
		order: parsed.order,
		limit: String(parsed.limit),
	});
	if (parsed.search) query.set('search', parsed.search);
	if (parsed.fromDate) query.set('fromDate', parsed.fromDate);
	if (parsed.toDate) query.set('toDate', parsed.toDate);

	if (parsed.cursor !== undefined) {
		query.set('cursor', parsed.cursor);
	}

	try {
		const result = await upstreamJson(
			`/owner/members?${query.toString()}`,
			{ method: 'GET' },
			memberListSchema,
		);

		if (result.response.status !== 200) {
			throw new UpstreamError(502, 'The service returned an incompatible response.');
		}

		return result.data;
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			throw new UpstreamError(502, 'The service returned an incompatible response.');
		}

		throw error;
	}
}
