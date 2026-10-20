import { z } from 'zod';

import {
	databaseIdSchema,
	membershipPlanInputSchema,
	membershipPlanOrderSchema,
} from '@/lib/contracts';
import { createMembershipPlan } from '@/lib/server/endpoints/membership-plans/create-membership-plan';
import { listMembershipPlans } from '@/lib/server/endpoints/membership-plans/list-membership-plans';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

const querySchema = z.strictObject({
	status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).default('ACTIVE'),
	order: membershipPlanOrderSchema.default('PRICE_ASC'),
	limit: z.coerce.number<number>().int().min(1).max(24).default(24),
	cursor: databaseIdSchema.optional(),
});

export async function GET(request: Request): Promise<Response> {
	try {
		const params = new URL(request.url).searchParams;
		const keys = [...params.keys()];
		if (new Set(keys).size !== keys.length) {
			throw new RequestError(400, 'Duplicate query parameters are not allowed.');
		}
		const filters = querySchema.parse(Object.fromEntries(params));
		const data = await listMembershipPlans(filters);
		return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json(
				{ message: error.message },
				{ status: error.status, headers: { 'Cache-Control': 'no-store' } },
			);
		}
		return errorResponse(error);
	}
}

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();
		const form = membershipPlanInputSchema.parse(await readJson(request));
		const result = await createMembershipPlan(
			{
				name: form.name,
				price: Number(form.price),
				description: form.description === '' ? null : form.description,
			},
			csrfToken,
			origin,
		);
		return Response.json(result.data, {
			status: 201,
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json({ message: error.message }, { status: error.status });
		}
		return errorResponse(error);
	}
}
