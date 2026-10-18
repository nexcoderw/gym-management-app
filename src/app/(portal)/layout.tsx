import type { ReactNode } from 'react';

import { AppShell } from '@/components/shared/app-shell';
import { requireOwnerPortalSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PortalLayout({ children }: { readonly children: ReactNode }) {
	const { session, organization } = await requireOwnerPortalSession();

	return (
		<AppShell displayName={session.displayName} organizationName={organization.name}>
			{children}
		</AppShell>
	);
}
