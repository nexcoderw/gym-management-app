import 'server-only';

import { cache } from 'react';

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
