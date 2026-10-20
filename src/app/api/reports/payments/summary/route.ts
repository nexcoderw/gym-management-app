import { paymentReportQuerySchema } from '@/lib/contracts';
import { getPaymentReportSummary } from '@/lib/server/endpoints/reports/get-payment-report-summary';
import { RequestError } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
	try {
		const params = new URL(request.url).searchParams;
		const keys = [...params.keys()];
		if (new Set(keys).size !== keys.length) {
			throw new RequestError(400, 'Duplicate query parameters are not allowed.');
		}
		const query = paymentReportQuerySchema.parse(Object.fromEntries(params));
		return Response.json(await getPaymentReportSummary(query), {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json(
				{ message: error.message },
				{ status: error.status, headers: { 'Cache-Control': 'no-store' } },
			);
		}
		return errorResponse(error);
	}
}
