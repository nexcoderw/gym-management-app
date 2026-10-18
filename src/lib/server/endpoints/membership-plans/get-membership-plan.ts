import 'server-only';

import { z } from 'zod';

import { membershipPlanSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

export async function getMembershipPlan(planId: string) {
	const id = z.uuid().parse(planId);
	return (await upstreamJson(`/owner/membership-plans/${id}`, {}, membershipPlanSchema)).data;
}
