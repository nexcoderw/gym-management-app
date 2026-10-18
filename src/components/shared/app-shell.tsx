import type { ReactNode } from 'react';

import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import styles from './app-shell.module.css';

export function AppShell({
	children,
	displayName,
	organizationName,
}: {
	readonly children: ReactNode;
	readonly displayName: string;
	readonly organizationName: string;
}) {
	return (
		<div className={styles.shell}>
			<Sidebar organizationName={organizationName} className={styles.sidebar} />
			<Navbar
				displayName={displayName}
				organizationName={organizationName}
				className={styles.navbar}
			/>
			<main id="main" tabIndex={-1} className={styles.main}>
				{children}
			</main>
		</div>
	);
}
