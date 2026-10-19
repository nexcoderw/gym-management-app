import { listReminderActivity } from '@/lib/server/endpoints/reminders/list-reminder-activity';
import { RequestError } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
	try {
		if (new URL(request.url).search !== '') {
			throw new RequestError(400, 'Query parameters are not supported.');
		}
		return Response.json(await listReminderActivity(), {
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
