import { databaseIdSchema } from '@/lib/contracts';
import { getPayment } from '@/lib/server/endpoints/payments/get-payment';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function GET(
	_request: Request,
	context: { readonly params: Promise<{ readonly paymentId: string }> },
): Promise<Response> {
	try {
		const paymentId = databaseIdSchema.parse((await context.params).paymentId);
		return Response.json(await getPayment(paymentId), {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		return errorResponse(error);
	}
}
