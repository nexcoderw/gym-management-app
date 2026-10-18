'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isCurrentDestination, navigation } from '@/constants/navigation';
import { Brand } from './brand';
import styles from './sidebar.module.css';

export function Sidebar({
	organizationName,
	className = '',
}: {
	readonly organizationName: string;
	readonly className?: string;
}) {
	const pathname = usePathname();

	return (
		<aside className={`${styles.sidebar} ${className}`} aria-label="Organization workspace">
			<div className={styles.brand}>
				<Brand organizationName={organizationName} />
			</div>
			<nav aria-label="Organization navigation" className={styles.nav}>
				{navigation.map((item) => (
					<Link
						key={item.key}
						href={item.href}
						prefetch={false}
						aria-current={isCurrentDestination(pathname, item.href) ? 'page' : undefined}
						className={styles.link}
					>
						<HugeiconsIcon icon={item.icon} size={20} color="currentColor" aria-hidden="true" />
						{item.label}
					</Link>
				))}
			</nav>
		</aside>
	);
}
