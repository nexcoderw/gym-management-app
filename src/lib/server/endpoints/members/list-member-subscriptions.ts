import 'server-only';

import { memberSubscriptionListSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

export async function listMemberSubscriptions(id: string, cursor?: string) {
	const query = new URLSearchParams({ limit: '20' });
	if (cursor !== undefined) query.set('cursor', cursor);
	const result = await upstreamJson(`/owner/members/${encodeURIComponent(id)}/subscriptions?${query}`, {}, memberSubscriptionListSchema);
	return result.data;
}
