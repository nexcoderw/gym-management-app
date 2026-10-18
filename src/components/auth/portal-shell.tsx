import { Dumbbell01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { Brand } from '@/components/shared/brand';
import styles from './portal-shell.module.css';

export function PortalShell({ children }: { children: ReactNode }) {
	return (
		<div className={styles.shell}>
			<main id="main" className={styles.main}>
				<section className={styles.frame} aria-label="NEXCODE Gym owner access">
					<div className={styles.content}>
						<Brand />
						<div className={styles.formArea}>{children}</div>
					</div>
					<aside className={styles.visual} aria-hidden="true">
						<div className={styles.visualIntro}>
							<span className={styles.visualLabel}>Owner workspace</span>
							<strong>Lead your gym with focus.</strong>
						</div>
						<div className={styles.visualNote}>
							<span className={styles.visualNoteIcon}>
								<HugeiconsIcon icon={Dumbbell01Icon} size={20} />
							</span>
							<span className={styles.visualNoteCopy}>
								<strong>Built for daily operations</strong>
								<small>Members, teams and performance in one place.</small>
							</span>
						</div>
					</aside>
				</section>
			</main>
		</div>
	);
}
