import { z } from 'zod';

import { membershipPlanInputSchema } from '@/lib/contracts';
import { createMembershipPlan } from '@/lib/server/endpoints/membership-plans/create-membership-plan';
import { listMembershipPlans } from '@/lib/server/endpoints/membership-plans/list-membership-plans';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

const querySchema = z.object({
	status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).default('ALL'),
	limit: z.coerce.number().int().min(1).max(50).default(50),
	cursor: z.uuid().optional(),
});

export async function GET(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const filters = querySchema.parse({
			status: url.searchParams.get('status') ?? undefined,
			limit: url.searchParams.get('limit') ?? undefined,
			cursor: url.searchParams.get('cursor') ?? undefined,
		});
		const data = await listMembershipPlans(filters);
		return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error: unknown) {
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
