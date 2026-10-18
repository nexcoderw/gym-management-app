import { z } from 'zod';

import { memberStatusSchema } from '@/lib/contracts';
import { listMembers } from '@/lib/server/endpoints/members/list-members';
import { RequestError } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

const querySchema = z.strictObject({
	status: memberStatusSchema.default('ACTIVE'),
	limit: z.coerce.number<number>().int().min(1).max(50).default(20),
	cursor: z.uuid().optional(),
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
