import { registerPaymentInputSchema } from '@/lib/contracts';
import { registerPayment } from '@/lib/server/endpoints/payments/register-payment';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();
		const input = registerPaymentInputSchema.parse(await readJson(request));
		return Response.json(await registerPayment(input, csrfToken, origin), {
			status: 201,
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
