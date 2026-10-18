import 'server-only';

import { z } from 'zod';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function archiveMember(
	id: string,
	updatedAt: string,
	csrfToken: string,
	origin: string,
): Promise<void> {
	const result = await upstreamJson(
		`/owner/members/${encodeURIComponent(id)}`,
		{
			method: 'DELETE',
			ifMatch: `"${updatedAt}"`,
			csrfToken,
			origin,
		},
		z.undefined(),
	);
	if (result.response.status !== 204)
		throw new UpstreamError(502, 'The service returned an incompatible response.');
}
