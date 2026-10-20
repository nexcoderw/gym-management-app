import 'server-only';

import { ZodError, type z } from 'zod';

import { paymentReportQuerySchema, paymentReportSummarySchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function getPaymentReportSummary(query: z.infer<typeof paymentReportQuerySchema>) {
	const params = new URLSearchParams(paymentReportQuerySchema.parse(query));
	try {
		const result = await upstreamJson(
			`/owner/reports/payments/summary?${params}`,
			{},
			paymentReportSummarySchema,
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
