import {
	databaseIdSchema,
	memberArchiveInputSchema,
	memberUpdateInputSchema,
} from '@/lib/contracts';
import { archiveMember } from '@/lib/server/endpoints/members/archive-member';
import { getMember } from '@/lib/server/endpoints/members/get-member';
import { updateMember } from '@/lib/server/endpoints/members/update-member';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';
type Context = { readonly params: Promise<{ readonly memberId: string }> };
const privateHeaders = { 'Cache-Control': 'no-store' };

export async function GET(_request: Request, context: Context): Promise<Response> {
	try {
		const id = databaseIdSchema.parse((await context.params).memberId);
		return Response.json(await getMember(id), { headers: privateHeaders });
	} catch (error: unknown) {
		return failure(error);
	}
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrf = await requireOwnerCsrfToken();
		const id = databaseIdSchema.parse((await context.params).memberId);
		const input = memberUpdateInputSchema.parse(await readJson(request));
		const result = await updateMember(id, input, input.updatedAt, csrf, origin);
		return Response.json(result, { headers: privateHeaders });
	} catch (error: unknown) {
		return failure(error);
	}
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrf = await requireOwnerCsrfToken();
		const id = databaseIdSchema.parse((await context.params).memberId);
		const input = memberArchiveInputSchema.parse(await readJson(request));
		await archiveMember(id, input.updatedAt, csrf, origin);
		return new Response(null, { status: 204, headers: privateHeaders });
	} catch (error: unknown) {
		return failure(error);
	}
}

function failure(error: unknown): Response {
	if (error instanceof RequestError)
		return Response.json(
			{ message: error.message },
			{ status: error.status, headers: privateHeaders },
		);
	return errorResponse(error);
}
