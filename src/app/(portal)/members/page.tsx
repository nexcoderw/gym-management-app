import type { Metadata } from 'next';

import { MembersWorkspace } from '@/components/members/members-workspace';
import { numberedMemberListSchema, type Member } from '@/lib/contracts';
import { listMembers } from '@/lib/server/endpoints/members/list-members';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

export const metadata: Metadata = {
	title: 'Members',
};

export default async function MembersPage() {
	await requireOwnerPortalSession();

	let initialItems: Member[] = [];
	let initialNextCursor: string | null = null;
	let initialTotalPages = 0;
	let initialTotalItems = 0;
	let initialErrorStatus: number | null = null;

	try {
		const page = await listMembers({
			status: 'ACTIVE',
			limit: 20,
			page: 1,
		});
		const numbered = numberedMemberListSchema.parse(page);

		initialItems = numbered.items;
		initialNextCursor = numbered.nextCursor;
		initialTotalPages = numbered.totalPages;
		initialTotalItems = numbered.totalItems;
	} catch (error: unknown) {
		initialErrorStatus = error instanceof UpstreamError ? error.status : 503;
	}

	return (
		<MembersWorkspace
			initialItems={initialItems}
			initialNextCursor={initialNextCursor}
			initialTotalPages={initialTotalPages}
			initialTotalItems={initialTotalItems}
			initialErrorStatus={initialErrorStatus}
		/>
	);
}
