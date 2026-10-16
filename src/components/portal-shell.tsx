import type { ReactNode } from 'react';
import { Brand } from './brand';
import styles from './portal-shell.module.css';

export function PortalShell({ children }: { children: ReactNode }) {
	return (
		<div className={styles.shell}>
			<header>
				<Brand />
				<span>Owner access</span>
			</header>
			<main id="main">{children}</main>
			<footer>Private organization portal · NEXCODE Africa</footer>
		</div>
	);
}
