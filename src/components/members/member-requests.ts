import { z } from 'zod';

/** Only same-origin registered BFF operations are called by members components. */
export async function memberRequest<T>(
	url: string,
	schema: z.ZodType<T>,
	init: RequestInit = {},
): Promise<T> {
	const response = await fetch(url, {
		...init,
		cache: 'no-store',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json' },
		signal: init.signal ?? AbortSignal.timeout(60_000),
	});
	if (!response.ok) throw new Error(memberMessage(response.status, init.method === 'DELETE'));
	try {
		return schema.parse(response.status === 204 ? undefined : await response.json());
	} catch {
		throw new Error('The service returned an incompatible response. Refresh before retrying.');
	}
}

function memberMessage(status: number, archive: boolean): string {
	if (status === 401) return 'Your session expired. Sign in again.';
	if (status === 403) return 'This action requires an active gym owner session.';
	if (status === 404)
		return 'The member or selected plan is no longer available. Refresh and try again.';
	if (status === 409)
		return archive
			? 'Cancel current and future registrations before archiving this member.'
			: 'The name, phone number or registration conflicts with an existing record. Review the details.';
	if (status === 412)
		return 'This member changed elsewhere. Close and reopen the dialog to load the latest version.';
	if (status === 429) return 'Too many requests. Wait before trying again.';
	if (status === 400) return 'Review the member details and selected plan.';
	return 'The request could not be confirmed. Refresh before retrying; use unchanged details to retry a registration safely.';
}
