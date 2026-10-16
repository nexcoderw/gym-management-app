import { z } from 'zod';

import { authenticatedSchema } from '@/lib/contracts';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { copyOwnerCookies, errorResponse, upstreamJson } from '@/lib/server/upstream';

const inputSchema = z
	.object({ email: z.email().max(254), password: z.string().min(1).max(1024) })
	.strict();

export async function POST(request: Request): Promise<Response> {
	try {
		requireSameOrigin(request);
		const body = inputSchema.parse(await readJson(request));
		const result = await upstreamJson(
			'/owner/auth/login',
			{ method: 'POST', body },
			authenticatedSchema,
		);
		const headers = new Headers({ 'Cache-Control': 'no-store' });
		copyOwnerCookies(result.response, headers);
		return Response.json(result.data, { headers });
	} catch (error: unknown) {
		if (error instanceof RequestError)
			return Response.json({ message: error.message }, { status: error.status });
		return errorResponse(error);
	}
}
