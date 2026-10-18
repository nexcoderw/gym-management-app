import { z } from 'zod';

export class PaymentRequestError extends Error {
	constructor(readonly status: number, message: string) {
		super(message);
	}
}

export async function paymentRequest<T>(
	url: string,
	schema: z.ZodType<T>,
	init: RequestInit = {},
): Promise<T> {
	let response: Response;
	try {
		response = await fetch(url, {
			...init,
			cache: 'no-store',
			credentials: 'same-origin',
			headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
			signal: init.signal ?? AbortSignal.timeout(60_000),
		});
	} catch {
		throw new PaymentRequestError(503, 'The payment request could not be confirmed. Refresh before retrying.');
	}
	if (!response.ok) throw new PaymentRequestError(response.status, paymentErrorMessage(response.status));
	try {
		return schema.parse(await response.json());
	} catch {
		throw new PaymentRequestError(502, 'The service returned an incompatible response.');
	}
}

export function paymentErrorMessage(status: number): string {
	if (status === 401) return 'Your session expired. Sign in again.';
	if (status === 403) return 'This action requires an active gym owner session.';
	if (status === 404) return 'The member or registration is no longer available. Refresh and try again.';
	if (status === 409) return 'This payment conflicts with the registration balance or an existing payment. Review the ledger before retrying.';
	if (status === 429) return 'Too many requests. Wait before trying again.';
	if (status === 400) return 'Review the payment details and try again.';
	return 'Payments are temporarily unavailable. Try again shortly.';
}
