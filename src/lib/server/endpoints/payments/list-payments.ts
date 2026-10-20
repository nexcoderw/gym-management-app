import 'server-only';

import { z, ZodError } from 'zod';

import {
	databaseIdSchema,
	paymentListSchema,
	paymentMethodSchema,
	paymentOrderSchema,
	paymentStatusSchema,
} from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export const paymentFiltersSchema = z.strictObject({
	status: paymentStatusSchema.optional(),
	method: paymentMethodSchema.optional(),
	memberId: databaseIdSchema.optional(),
	order: paymentOrderSchema.default('NEWEST'),
	limit: z.number().int().min(1).max(50).default(50),
	cursor: databaseIdSchema.optional(),
});

export async function listPayments(filters: z.input<typeof paymentFiltersSchema> = {}) {
	const parsed = paymentFiltersSchema.parse(filters);
	const query = new URLSearchParams({ order: parsed.order, limit: String(parsed.limit) });
	if (parsed.status !== undefined) query.set('status', parsed.status);
	if (parsed.method !== undefined) query.set('method', parsed.method);
	if (parsed.memberId !== undefined) query.set('memberId', parsed.memberId);
	if (parsed.cursor !== undefined) query.set('cursor', parsed.cursor);
	try {
		const result = await upstreamJson(`/owner/payments?${query}`, {}, paymentListSchema);
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
