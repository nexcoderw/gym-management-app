'use client';

import { AlertCircleIcon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { PortalShell } from '@/components/auth/portal-shell';
import { Button } from '@/components/shared/button';
import styles from './error.module.css';

export default function ErrorPage({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<PortalShell>
			<section className={styles.state}>
				<HugeiconsIcon icon={AlertCircleIcon} size={34} color="var(--navy)" />
				<span>503</span>
				<h1>Portal temporarily unavailable</h1>
				<p>Your access was not changed. Try the secure request again.</p>
				<Button icon={RefreshIcon} onClick={reset}>
					Try again
				</Button>
			</section>
		</PortalShell>
	);
}
