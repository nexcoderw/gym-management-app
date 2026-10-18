import 'server-only';

import { membershipPlanSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

export function createMembershipPlan(
	input: { readonly name: string; readonly price: number; readonly description: string | null },
	csrfToken: string,
	origin: string,
) {
	return upstreamJson(
		'/owner/membership-plans',
		{ method: 'POST', body: input, csrfToken, origin },
		membershipPlanSchema,
	);
}
