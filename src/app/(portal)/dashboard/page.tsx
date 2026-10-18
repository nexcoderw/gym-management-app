import { Building03Icon, UserIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { requireOwnerPortalSession } from '@/lib/server/session';
import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
	const { organization } = await requireOwnerPortalSession();
	return { title: `${organization.name} dashboard` };
}

export default async function DashboardPage() {
	const { session, organization } = await requireOwnerPortalSession();

	return (
		<div className={styles.page}>
			<PageHeader
				title="Dashboard"
				description={`Current owner access and organization status for ${organization.name}.`}
			/>
			<section className={styles.access} aria-label="Organization access summary">
				<div>
					<HugeiconsIcon icon={Building03Icon} size={22} aria-hidden="true" />
					<span>Gym status</span>
					<strong>
						{organization.status === 'PENDING'
							? 'Awaiting NEXCODE approval'
							: organization.status.toLowerCase()}
					</strong>
				</div>
				<div>
					<HugeiconsIcon icon={UserIcon} size={22} aria-hidden="true" />
					<span>Signed in owner</span>
					<strong>{session.displayName}</strong>
					<small>Owner · {session.email}</small>
				</div>
			</section>
			{organization.status === 'PENDING' ? (
				<aside className={styles.notice}>
					<strong>Setup is complete.</strong>
					<span>Operational management will unlock after NEXCODE activates this gym.</span>
				</aside>
			) : null}
		</div>
	);
}
