import { z } from 'zod';

import { databaseIdSchema } from '@/lib/contracts';
import { listMemberSubscriptions } from '@/lib/server/endpoints/members/list-member-subscriptions';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';
const querySchema = z.strictObject({ cursor: databaseIdSchema.optional() });

export async function GET(
	request: Request,
	context: { readonly params: Promise<{ readonly memberId: string }> },
): Promise<Response> {
	try {
		const id = databaseIdSchema.parse((await context.params).memberId);
		const params = new URL(request.url).searchParams;
		if ([...params.keys()].length !== new Set(params.keys()).size) {
			return Response.json(
				{ message: 'Duplicate query parameters are not allowed.' },
				{ status: 400, headers: { 'Cache-Control': 'no-store' } },
			);
		}
		const query = querySchema.parse(Object.fromEntries(params));
		return Response.json(await listMemberSubscriptions(id, query.cursor), {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		return errorResponse(error);
	}
}
