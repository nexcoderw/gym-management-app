import 'server-only';

import { memberSchema } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

export async function getMember(id: string) {
	const result = await upstreamJson(`/owner/members/${encodeURIComponent(id)}`, {}, memberSchema);
	return result.data;
}
