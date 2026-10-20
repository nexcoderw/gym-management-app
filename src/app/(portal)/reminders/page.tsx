
import type { Metadata } from 'next';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import type { ReminderActivityItem, UpcomingReminderItem } from '@/lib/contracts';
import { listReminderActivity } from '@/lib/server/endpoints/reminders/list-reminder-activity';
import { listUpcomingReminders } from '@/lib/server/endpoints/reminders/list-upcoming-reminders';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

export const metadata: Metadata = { title: 'Reminders' };

export default async function RemindersPage() {
	await requireOwnerPortalSession();
	let items: ReminderActivityItem[] = [];
	let errorStatus: number | null = null;
	let upcoming: UpcomingReminderItem[] = [];
	let nextCursor: string | null = null;
	let upcomingErrorStatus: number | null = null;
	try {
		const page = await listUpcomingReminders();
		upcoming = page.items;
		nextCursor = page.nextCursor;
	} catch (error: unknown) {
		upcomingErrorStatus = error instanceof UpstreamError ? error.status : 503;
	}
	try {
		items = (await listReminderActivity()).items;
	} catch (error: unknown) {
		errorStatus = error instanceof UpstreamError ? error.status : 503;
	}

	return (
		<RemindersWorkspace
			key={[...upcoming.map((item) => `${item.subscriptionId}:${item.manualStatus ?? ''}`), nextCursor ?? '', items[0]?.id ?? ''].join('|')}
			items={items}
			errorStatus={errorStatus}
			upcoming={upcoming}
			nextCursor={nextCursor}
			upcomingErrorStatus={upcomingErrorStatus}
		/>
	);
}
