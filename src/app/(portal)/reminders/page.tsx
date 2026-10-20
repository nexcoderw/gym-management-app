
import type { Metadata } from 'next';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import type { UpcomingReminderItem } from '@/lib/contracts';
import { listUpcomingReminders } from '@/lib/server/endpoints/reminders/list-upcoming-reminders';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

export const metadata: Metadata = { title: 'Reminders' };

export default async function RemindersPage() {
	await requireOwnerPortalSession();
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
	return (
		<RemindersWorkspace
			key={[...upcoming.map((item) => `${item.subscriptionId}:${item.manualStatus ?? ''}`), nextCursor ?? ''].join('|')}
			upcoming={upcoming}
			nextCursor={nextCursor}
			upcomingErrorStatus={upcomingErrorStatus}
		/>
	);
}
