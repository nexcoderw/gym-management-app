import 'server-only';

import type { z } from 'zod';

import { paymentReportQuerySchema } from '@/lib/contracts';
import { upstreamPdf } from '@/lib/server/upstream';

export async function getPaymentReportPdf(
	query: z.infer<typeof paymentReportQuerySchema>,
): Promise<Uint8Array<ArrayBuffer>> {
	const params = new URLSearchParams(paymentReportQuerySchema.parse(query));
	return upstreamPdf(`/owner/reports/payments/pdf?${params}`);
}
