import { z } from 'zod';

import { authenticatedSchema } from '@/lib/contracts';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { copyOwnerCookies, errorResponse, upstreamJson } from '@/lib/server/upstream';

const inputSchema = z
	.object({
		challengeToken: z.string().min(32).max(256),
		displayName: z.string().trim().min(1).max(160),
		password: z.string().min(12).max(1024),
	})
	.strict();

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const body = inputSchema.parse(await readJson(request));
		const result = await upstreamJson(
			'/owner-enrollment/registrations',
			{ method: 'POST', body, origin },
			authenticatedSchema,
		);
		const headers = new Headers({ 'Cache-Control': 'no-store' });
		copyOwnerCookies(result.response, headers);
		return Response.json(result.data, { status: 201, headers });
	} catch (error: unknown) {
		if (error instanceof RequestError)
			return Response.json({ message: error.message }, { status: error.status });
		return errorResponse(error);
	}
}
