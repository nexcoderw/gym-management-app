import 'server-only';

import { ZodError } from 'zod';

import { paymentSchema, type RegisterPaymentInput } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function registerPayment(
	input: RegisterPaymentInput,
	csrfToken: string,
	origin: string,
) {
	try {
		const result = await upstreamJson(
			'/owner/payments/registrations',
			{
				method: 'POST',
				body: {
					...(input.memberId === undefined ? {} : { memberId: input.memberId }),
					...(input.member === undefined
						? {}
						: {
								member: {
									name: input.member.name,
									phoneNumber: input.member.phoneNumber,
									...(input.member.email === null ? {} : { email: input.member.email }),
								},
							}),
					subscription: input.subscription,
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
