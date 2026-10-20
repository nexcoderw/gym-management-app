import 'server-only';

import { cache } from 'react';
import { forbidden, unauthorized } from 'next/navigation';

import { sessionSchema, type OwnerSession } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from './upstream';

export const getOwnerSession = cache(async (): Promise<OwnerSession | null> => {
	try {
		return (await upstreamJson('/owner/auth/session', {}, sessionSchema)).data;
	} catch (error: unknown) {
		if (error instanceof UpstreamError && error.status === 401) return null;
		throw error;
	}
});

export async function requireOwnerPortalSession() {
	const session = await getOwnerSession();
	if (!session) unauthorized();

	const organization = session.organizations.find(({ roles }) => roles.includes('owner'));
	if (!organization) forbidden();

	return { session, organization };
}
