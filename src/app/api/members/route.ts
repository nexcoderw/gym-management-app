import { z } from 'zod';

import {
	databaseIdSchema,
	listDateSchema,
	memberOrderSchema,
	memberRegistrationInputSchema,
	memberStatusSchema,
} from '@/lib/contracts';
import { createMember } from '@/lib/server/endpoints/members/create-member';
import { listMembers } from '@/lib/server/endpoints/members/list-members';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

const querySchema = z.strictObject({
	status: memberStatusSchema.default('ACTIVE'),
	order: memberOrderSchema.default('NEWEST'),
	fromDate: listDateSchema.optional(),
	toDate: listDateSchema.optional(),
	limit: z.coerce.number<number>().int().min(1).max(24).default(24),
	cursor: databaseIdSchema.optional(),
});

export async function GET(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const keys = [...url.searchParams.keys()];

		if (new Set(keys).size !== keys.length) {
			throw new RequestError(400, 'Duplicate query parameters are not allowed.');
		}

		const filters = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

		const result = await listMembers(filters);

		return Response.json(result, {
			status: 200,
			headers: {
				'Cache-Control': 'no-store',
			},
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json(
				{ message: error.message },
				{
					status: error.status,
					headers: { 'Cache-Control': 'no-store' },
				},
			);
		}

		return errorResponse(error);
	}
}

export async function POST(request: Request): Promise<Response> {
	try {
		// Validate the exact manager origin before processing the request body.
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();

		const input = memberRegistrationInputSchema.parse(await readJson(request));

		const registered = await createMember(input, csrfToken, origin);

		return Response.json(registered, {
			status: 201,
			headers: {
				'Cache-Control': 'no-store',
			},
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json(
				{ message: error.message },
				{
					status: error.status,
					headers: { 'Cache-Control': 'no-store' },
				},
			);
		}

		return errorResponse(error);
	}
}
