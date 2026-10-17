import { cookies } from 'next/headers';

import { RequestError, requireSameOrigin } from '@/lib/server/request';
import { copyOwnerCookies, errorResponse, upstreamJson } from '@/lib/server/upstream';
import { z } from 'zod';

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const store = await cookies();
		const csrfToken =
			store.get('__Host-nexcode-owner-csrf')?.value ?? store.get('nexcode-owner-csrf')?.value;
		if (csrfToken === undefined)
			throw new RequestError(403, 'The secure session could not be verified.');
		const result = await upstreamJson(
			'/owner/auth/logout',
			{ method: 'POST', csrfToken, origin },
			z.unknown(),
		);
		const headers = new Headers({ 'Cache-Control': 'no-store' });
		copyOwnerCookies(result.response, headers);
		return new Response(null, { status: 204, headers });
	} catch (error: unknown) {
		if (error instanceof RequestError)
			return Response.json({ message: error.message }, { status: error.status });
		return errorResponse(error);
	}
}
