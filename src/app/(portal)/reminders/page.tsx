
import type { Metadata } from 'next';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import type { ReminderActivityItem } from '@/lib/contracts';
import { listReminderActivity } from '@/lib/server/endpoints/reminders/list-reminder-activity';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

export const metadata: Metadata = { title: 'Reminders' };

export default async function RemindersPage() {
	await requireOwnerPortalSession();
	let items: ReminderActivityItem[] = [];
	let errorStatus: number | null = null;
	try {
		items = (await listReminderActivity()).items;
	} catch (error: unknown) {
		errorStatus = error instanceof UpstreamError ? error.status : 503;
	}

	return <RemindersWorkspace items={items} errorStatus={errorStatus} />;
}
