import { z } from 'zod';

import { listUpcomingReminders } from '@/lib/server/endpoints/reminders/list-upcoming-reminders';
import { RequestError } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const cursor = url.searchParams.get('cursor');
		if ([...url.searchParams.keys()].some((key) => key !== 'cursor')) {
			throw new RequestError(400, 'Unsupported reminder query.');
		}
		if (cursor !== null && !z.guid().safeParse(cursor).success) {
			throw new RequestError(400, 'Invalid reminder page.');
		}
		return Response.json(await listUpcomingReminders(cursor ?? undefined), {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json({ message: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
		}
		return errorResponse(error);
	}
}
