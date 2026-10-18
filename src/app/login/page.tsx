import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { PortalShell } from '@/components/auth/portal-shell';
import { routes } from '@/constants/routes';
import { getOwnerSession } from '@/lib/server/session';

export const metadata: Metadata = { title: 'Owner sign in' };
export default async function LoginPage() {
	if (await getOwnerSession()) redirect(routes.dashboard);
	return (
		<PortalShell>
			<LoginForm />
		</PortalShell>
	);
}
