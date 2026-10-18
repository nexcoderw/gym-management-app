import { z } from 'zod';

import { membershipPlanInputSchema } from '@/lib/contracts';
import { archiveMembershipPlan } from '@/lib/server/endpoints/membership-plans/archive-membership-plan';
import { getMembershipPlan } from '@/lib/server/endpoints/membership-plans/get-membership-plan';
import { updateMembershipPlan } from '@/lib/server/endpoints/membership-plans/update-membership-plan';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

const mutationSchema = membershipPlanInputSchema.extend({ updatedAt: z.iso.datetime() }).strict();
const archiveSchema = z.object({ updatedAt: z.iso.datetime() }).strict();

type RouteContext = { readonly params: Promise<{ readonly planId: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
	try {
		const planId = z.uuid().parse((await context.params).planId);
		const data = await getMembershipPlan(planId);
		return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error: unknown) {
		return errorResponse(error);
	}
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();
		const planId = z.uuid().parse((await context.params).planId);
		const form = mutationSchema.parse(await readJson(request));
		const result = await updateMembershipPlan(
			planId,
			{
				name: form.name,
				price: Number(form.price),
				description: form.description === '' ? null : form.description,
			},
			form.updatedAt,
			csrfToken,
			origin,
		);
		return Response.json(result.data, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json({ message: error.message }, { status: error.status });
		}
		return errorResponse(error);
	}
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();
		const planId = z.uuid().parse((await context.params).planId);
		const input = archiveSchema.parse(await readJson(request));
		await archiveMembershipPlan(planId, input.updatedAt, csrfToken, origin);
		return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json({ message: error.message }, { status: error.status });
		}
		return errorResponse(error);
	}
}
