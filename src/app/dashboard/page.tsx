import { Building03Icon, UserIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { LogoutButton } from '@/components/logout-button';
import { getOwnerSession } from '@/lib/server/session';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };
export default async function DashboardPage() {
	const session = await getOwnerSession();
	if (!session) redirect('/login');
	const organization = session.organizations.find(({ roles }) => roles.includes('owner'));
	if (!organization) redirect('/login');
	return (
		<div className={styles.shell}>
			<header>
				<Brand />
				<LogoutButton />
			</header>
			<main id="main">
				<div className={styles.intro}>
					<span>ORGANIZATION PORTAL</span>
					<h1>{organization.name}</h1>
					<p>Secure owner access for your NEXCODE Gym organization.</p>
				</div>
				<section className={styles.access}>
					<div>
						<HugeiconsIcon icon={Building03Icon} size={22} />
						<span>Gym status</span>
						<strong>
							{organization.status === 'PENDING'
								? 'Awaiting NEXCODE approval'
								: organization.status.toLowerCase()}
						</strong>
					</div>
					<div>
						<HugeiconsIcon icon={UserIcon} size={22} />
						<span>Signed in owner</span>
						<strong>{session.displayName}</strong>
						<small>Owner · {session.email}</small>
					</div>
				</section>
				{organization.status === 'PENDING' && (
					<aside>
						<strong>Setup is complete.</strong>
						<span>Operational management will unlock after NEXCODE activates this gym.</span>
					</aside>
				)}
			</main>
		</div>
	);
}
