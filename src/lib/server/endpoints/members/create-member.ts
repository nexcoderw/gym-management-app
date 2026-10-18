import 'server-only';

import { ZodError } from 'zod';

import { memberRegistrationResponseSchema, type MemberRegistrationInput } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function createMember(
	input: MemberRegistrationInput,
	csrfToken: string,
	origin: string,
) {
	try {
		const result = await upstreamJson(
			'/owner/members',
			{
				method: 'POST',
				body: {
					name: input.name,
					phoneNumber: input.phoneNumber,
					email: input.email,
					subscription: input.subscription,
				},
				idempotencyKey: input.idempotencyKey,
				csrfToken,
				origin,
			},
			memberRegistrationResponseSchema,
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
