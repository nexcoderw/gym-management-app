import 'server-only';

import { z } from 'zod';

import { upstreamJson } from '@/lib/server/upstream';

export function archiveMembershipPlan(
	planId: string,
	updatedAt: string,
	csrfToken: string,
	origin: string,
) {
	return upstreamJson(
		`/owner/membership-plans/${planId}`,
		{
			method: 'DELETE',
			csrfToken,
			origin,
			ifMatch: `"${updatedAt}"`,
		},
		z.unknown(),
	);
}
