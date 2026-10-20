import { z } from 'zod';

import {
	databaseIdSchema,
	listDateSchema,
	listSearchSchema,
	paymentInputSchema,
	paymentMethodSchema,
	paymentOrderSchema,
	paymentStatusSchema,
} from '@/lib/contracts';
import { createPayment } from '@/lib/server/endpoints/payments/create-payment';
import { listPayments } from '@/lib/server/endpoints/payments/list-payments';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { readJson, RequestError, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

const querySchema = z.strictObject({
	status: paymentStatusSchema.optional(),
	search: listSearchSchema.optional(),
	method: paymentMethodSchema.optional(),
	memberId: databaseIdSchema.optional(),
	order: paymentOrderSchema.default('NEWEST'),
	fromDate: listDateSchema.optional(),
	toDate: listDateSchema.optional(),
	limit: z.coerce.number<number>().int().min(1).max(24).default(24),
	cursor: databaseIdSchema.optional(),
});

export async function GET(request: Request): Promise<Response> {
	try {
		const params = new URL(request.url).searchParams;
		const keys = [...params.keys()];
		if (new Set(keys).size !== keys.length) {
			throw new RequestError(400, 'Duplicate query parameters are not allowed.');
		}
		const filters = querySchema.parse(Object.fromEntries(params));
		return Response.json(await listPayments(filters), {
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

export async function POST(request: Request): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();
		const input = paymentInputSchema.parse(await readJson(request));
		return Response.json(await createPayment(input, csrfToken, origin), {
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
