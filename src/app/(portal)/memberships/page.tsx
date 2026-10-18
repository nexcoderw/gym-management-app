import type { Metadata } from 'next';

import { MembershipsWorkspace } from '@/components/memberships/memberships-workspace';
import type { MembershipPlan } from '@/lib/contracts';
import { listMembershipPlans } from '@/lib/server/endpoints/membership-plans/list-membership-plans';

export const metadata: Metadata = { title: 'Memberships' };

export default async function MembershipsPage() {
	let initialItems: MembershipPlan[] = [];
	let initialNextCursor: string | null = null;
	let initialError: string | undefined;

	try {
		const page = await listMembershipPlans({ status: 'ALL', limit: 50 });
		initialItems = page.items;
		initialNextCursor = page.nextCursor;
	} catch {
		initialError = 'Memberships could not be loaded. Try again shortly.';
	}

	return (
		<MembershipsWorkspace
			initialItems={initialItems}
			initialNextCursor={initialNextCursor}
			initialError={initialError}
		/>
	);
}
