import type { Metadata } from 'next';

import { MembershipsWorkspace } from '@/components/memberships/memberships-workspace';
import { listMembershipPlans } from '@/lib/server/endpoints/membership-plans/list-membership-plans';

export const metadata: Metadata = { title: 'Memberships' };

export default async function MembershipsPage() {
	try {
		const page = await listMembershipPlans({ status: 'ALL', limit: 50 });
		return <MembershipsWorkspace initialItems={page.items} initialNextCursor={page.nextCursor} />;
	} catch {
		return (
			<MembershipsWorkspace
				initialItems={[]}
				initialNextCursor={null}
				initialError="Memberships could not be loaded. Try again shortly."
			/>
		);
	}
}
