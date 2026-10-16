import type { Metadata } from 'next';
import { InvitationFlow } from '@/components/invitation-flow';
import { PortalShell } from '@/components/portal-shell';

export const metadata: Metadata = { title: 'Accept invitation' };
export default function AcceptInvitationPage() {
	return (
		<PortalShell>
			<InvitationFlow />
		</PortalShell>
	);
}
