import { PortalShell } from '@/components/auth/portal-shell';
import { RouteLoadingState } from '@/components/shared/route-loading-state';

export default function Loading() {
	return (
		<PortalShell>
			<RouteLoadingState title="Sign in" subject="your sign-in page" compact />
		</PortalShell>
	);
}
