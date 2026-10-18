import 'server-only';

import { memberSchema, type MemberProfileInput } from '@/lib/contracts';
import { upstreamJson } from '@/lib/server/upstream';

export async function updateMember(id: string, input: MemberProfileInput, updatedAt: string, csrfToken: string, origin: string) {
	const result = await upstreamJson(`/owner/members/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: { name: input.name, phoneNumber: input.phoneNumber, email: input.email },
		ifMatch: `"${updatedAt}"`, csrfToken, origin,
	}, memberSchema);
	return result.data;
}
