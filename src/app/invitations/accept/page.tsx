import type { Metadata } from 'next';
import { InvitationFlow } from '@/components/auth/invitation-flow';
import { PortalShell } from '@/components/auth/portal-shell';

export const metadata: Metadata = { title: 'Accept invitation' };
export default function AcceptInvitationPage() {
	return (
		<PortalShell>
			<InvitationFlow />
		</PortalShell>
	);
}
