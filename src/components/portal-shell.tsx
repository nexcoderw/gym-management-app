import { Dumbbell01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { Brand } from './brand';
import styles from './portal-shell.module.css';

export function PortalShell({ children }: { children: ReactNode }) {
	return (
		<div className={styles.shell}>
			<main id="main" className={styles.main}>
				<section className={styles.frame} aria-label="NEXCODE Gym owner access">
					<div className={styles.content}>
						<Brand />
						<div className={styles.formArea}>{children}</div>
						<p className={styles.privacy}>
							<HugeiconsIcon icon={Shield01Icon} size={15} aria-hidden="true" />
							Private and secure organization access
						</p>
					</div>
					<aside className={styles.visual} aria-hidden="true">
						<div className={styles.visualIntro}>
							<span>Owner workspace</span>
							<strong>Lead your gym with focus.</strong>
						</div>
						<div className={styles.visualNote}>
							<HugeiconsIcon icon={Dumbbell01Icon} size={22} />
							<span>
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
