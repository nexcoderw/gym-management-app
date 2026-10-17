import { z } from 'zod';

import { enrollmentChallengeSchema } from '@/lib/contracts';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse, upstreamJson } from '@/lib/server/upstream';

const inputSchema = z.object({ invitationToken: z.string().min(32).max(512) }).strict();

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const body = inputSchema.parse(await readJson(request));
		const { data } = await upstreamJson(
			'/owner-enrollment/challenges',
			{ method: 'POST', body, origin },
			enrollmentChallengeSchema,
		);
		return Response.json(data, {
			headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json({ message: error.message }, { status: error.status });
		}
		return errorResponse(error);
	}
}
