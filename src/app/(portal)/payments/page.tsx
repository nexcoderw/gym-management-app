import type { Metadata } from 'next';

import { PaymentsWorkspace } from '@/components/payments/payments-workspace';
import type { Payment } from '@/lib/contracts';
import { listPayments } from '@/lib/server/endpoints/payments/list-payments';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
	await requireOwnerPortalSession();
	let initialItems: Payment[] = [];
	let initialNextCursor: string | null = null;
	let initialErrorStatus: number | null = null;
	try {
		const page = await listPayments({ order: 'NEWEST', limit: 50 });
		initialItems = page.items;
		initialNextCursor = page.nextCursor;
	} catch (error: unknown) {
		initialErrorStatus = error instanceof UpstreamError ? error.status : 503;
	}
	return (
		<PaymentsWorkspace
			initialItems={initialItems}
			initialNextCursor={initialNextCursor}
			initialErrorStatus={initialErrorStatus}
		/>
	);
}
