import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/components/dashboard/section-placeholder';

export const metadata: Metadata = { title: 'Reminders' };

export default function RemindersPage() {
	return (
		<SectionPlaceholder
			title="Reminders"
			description="Prepare and track member reminders sent on behalf of this gym."
		/>
	);
}
