import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/components/dashboard/section-placeholder';

export const metadata: Metadata = { title: 'Members' };

export default function MembersPage() {
	return (
		<SectionPlaceholder
			title="Members"
			description="Manage member profiles, access and account status for this gym."
		/>
	);
}
