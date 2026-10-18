import 'server-only';

import { z, ZodError } from 'zod';

import { memberListSchema, memberStatusSchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

const filtersSchema = z.strictObject({
	status: memberStatusSchema.default('ACTIVE'),
	limit: z.number().int().min(1).max(50).default(20),
	cursor: z.uuid().optional(),
});

export type MemberListFilters = z.input<typeof filtersSchema>;

export async function listMembers(filters: MemberListFilters = {}) {
	const parsed = filtersSchema.parse(filters);

	const query = new URLSearchParams({
		status: parsed.status,
		limit: String(parsed.limit),
	});

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
