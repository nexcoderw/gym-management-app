import 'server-only';

import { membershipPlanSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

export function updateMembershipPlan(
	planId: string,
	input: { readonly name: string; readonly price: number; readonly description: string | null },
	updatedAt: string,
	csrfToken: string,
	origin: string,
) {
	return upstreamJson(
		`/owner/membership-plans/${planId}`,
		{
			method: 'PATCH',
			body: input,
			csrfToken,
			origin,
			ifMatch: `"${updatedAt}"`,
		},
		membershipPlanSchema,
	);
}
