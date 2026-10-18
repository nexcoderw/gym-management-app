
import type { Metadata } from 'next';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import { requireOwnerPortalSession } from '@/lib/server/session';

export const metadata: Metadata = { title: 'Reminders' };

export default async function RemindersPage() {
	const { organization } = await requireOwnerPortalSession();

	return <RemindersWorkspace organizationName={organization.name} />;
}
