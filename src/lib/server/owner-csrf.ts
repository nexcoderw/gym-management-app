import 'server-only';

import { cookies } from 'next/headers';

import { RequestError } from './request';

export async function requireOwnerCsrfToken(): Promise<string> {
	const store = await cookies();
	const token =
		store.get('__Host-nexcode-owner-csrf')?.value ?? store.get('nexcode-owner-csrf')?.value;
	if (token === undefined) throw new RequestError(403, 'The secure session could not be verified.');
	return token;
}
