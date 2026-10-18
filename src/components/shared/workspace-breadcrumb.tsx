'use client';

import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { usePathname } from 'next/navigation';

import { currentDestination } from '@/constants/navigation';
import styles from './workspace-breadcrumb.module.css';

export function WorkspaceBreadcrumb({ organizationName }: { readonly organizationName: string }) {
	const current = currentDestination(usePathname());

	return (
		<nav aria-label="Breadcrumb" className={styles.breadcrumb}>
			<ol className={styles.list}>
				<li className={styles.root}>{organizationName}</li>
				{current ? (
					<li className={styles.item}>
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							size={14}
							color="currentColor"
							aria-hidden="true"
						/>
						<span aria-current="page" className={styles.current}>
							{current.label}
						</span>
					</li>
				) : null}
			</ol>
		</nav>
	);
}
