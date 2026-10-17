import { cookies } from 'next/headers';
import { z } from 'zod';

import { acceptedSchema } from '@/lib/contracts';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse, upstreamJson } from '@/lib/server/upstream';

const inputSchema = z.object({ challengeToken: z.string().min(32).max(256) }).strict();

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const body = inputSchema.parse(await readJson(request));
		const store = await cookies();
		const csrfToken =
			store.get('__Host-nexcode-owner-csrf')?.value ?? store.get('nexcode-owner-csrf')?.value;
		if (csrfToken === undefined)
			throw new RequestError(403, 'The secure session could not be verified.');
		const { data } = await upstreamJson(
			'/owner-enrollment/acceptances',
			{ method: 'POST', body, csrfToken, origin },
			acceptedSchema,
		);
		return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error: unknown) {
		if (error instanceof RequestError)
			return Response.json({ message: error.message }, { status: error.status });
		return errorResponse(error);
	}
}
