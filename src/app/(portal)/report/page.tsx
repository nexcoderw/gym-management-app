import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/components/dashboard/section-placeholder';

export const metadata: Metadata = { title: 'Report' };

export default function ReportPage() {
	return (
		<SectionPlaceholder
			title="Report"
			description="Review trustworthy organization reporting when operational data is available."
		/>
	);
}
