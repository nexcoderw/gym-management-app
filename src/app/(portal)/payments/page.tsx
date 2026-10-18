import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/components/dashboard/section-placeholder';

export const metadata: Metadata = { title: 'Payments' };

export default function PaymentsPage() {
	return (
		<SectionPlaceholder
			title="Payments"
			description="Review verified membership payments and payment activity for this gym."
		/>
	);
}
