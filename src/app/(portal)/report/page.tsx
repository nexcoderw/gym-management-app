import { ArrowRight01Icon, ChartLineData01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Metadata } from 'next';

import { ButtonLink } from '@/components/shared/button';
import { PageHeader } from '@/components/shared/page-header';
import { routes } from '@/constants/routes';
import { requireOwnerPortalSession } from '@/lib/server/session';

import styles from './page.module.css';

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportPage() {
	await requireOwnerPortalSession();

	return (
		<div className={styles.page}>
			<PageHeader title="Reports" description="Membership and payment reporting for your gym." />
			<section className={styles.construction} aria-labelledby="report-construction-title">
				<div className={styles.icon} aria-hidden="true">
					<HugeiconsIcon icon={ChartLineData01Icon} size={32} strokeWidth={1.6} />
				</div>
				<h2 id="report-construction-title">Reports are under construction</h2>
				<p>
					We’re building reports from your gym’s memberships and payments. Until they’re ready,
					you can review the payment ledger.
				</p>
				<ButtonLink href={routes.payments} icon={ArrowRight01Icon} width="medium">
					View payments
				</ButtonLink>
			</section>
		</div>
	);
}
