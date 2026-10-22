import 'server-only';

import { ZodError, type z } from 'zod';

import { dashboardAnalyticsSchema, dashboardQuerySchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function getDashboardAnalytics(query: z.infer<typeof dashboardQuerySchema>) {
	const parsed = dashboardQuerySchema.parse(query);
	const params = new URLSearchParams();
	if (parsed.fromDate && parsed.toDate) {
		params.set('fromDate', parsed.fromDate);
		params.set('toDate', parsed.toDate);
	}
	const suffix = params.size > 0 ? `?${params}` : '';
	try {
		const result = await upstreamJson(
			`/owner/dashboard/analytics${suffix}`,
			{},
			dashboardAnalyticsSchema,
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
