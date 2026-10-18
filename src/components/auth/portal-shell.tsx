import type { ReactNode } from 'react';

import styles from './portal-shell.module.css';

export function PortalShell({ children }: { children: ReactNode }) {
	return (
		<div className={styles.shell}>
			<main id="main" className={styles.main}>
				<section className={styles.frame} aria-label="Gym owner access">
					<div className={styles.content}>
						<div className={styles.formArea}>{children}</div>
					</div>
					<aside className={styles.visual} aria-hidden="true" />
				</section>
			</main>
		</div>
	);
}
