import 'server-only';

import { ZodError } from 'zod';

import { paymentSchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function getPayment(paymentId: string) {
	try {
		const result = await upstreamJson(
			`/owner/payments/${encodeURIComponent(paymentId)}`,
			{},
			paymentSchema,
		);
		if (result.response.status !== 200) {
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
