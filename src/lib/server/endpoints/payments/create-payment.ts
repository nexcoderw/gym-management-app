import 'server-only';

import { ZodError } from 'zod';

import { paymentSchema, type PaymentInput } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function createPayment(input: PaymentInput, csrfToken: string, origin: string) {
	try {
		const result = await upstreamJson(
			'/owner/payments',
			{
				method: 'POST',
				body: {
					memberId: input.memberId,
					subscriptionId: input.subscriptionId,
					amount: input.amount,
					method: input.method,
					occurredAt: input.occurredAt,
					...(input.providerReference ? { providerReference: input.providerReference } : {}),
					...(input.note ? { note: input.note } : {}),
				},
				idempotencyKey: input.idempotencyKey,
				csrfToken,
				origin,
			},
			paymentSchema,
		);
		if (result.response.status !== 201) {
			throw new UpstreamError(502, 'The service returned an incompatible response.');
		}
		return result.data;
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			throw new UpstreamError(502, 'The service returned an incompatible response.');
		}
		throw error;
	}
}
