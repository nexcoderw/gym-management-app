import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import styles from './results-loading-state.module.css';

interface ResultsLoadingStateProps {
	readonly subject: string;
	readonly searching?: boolean;
}

/** A shared, non-interactive pending state for tenant-scoped result lists. */
export function ResultsLoadingState({ subject, searching = false }: ResultsLoadingStateProps) {
	return (
		<div className={styles.root} role="status" aria-live="polite">
			<span className={styles.emblem} aria-hidden="true">
				<span className={styles.ring} />
				<HugeiconsIcon icon={Search01Icon} size={23} strokeWidth={1.8} />
			</span>
			<div className={styles.copy}>
				<h2>{searching ? `Searching ${subject}` : `Loading ${subject}`}</h2>
				<p>
					{searching
						? 'Checking matching records across this gym.'
						: 'Getting the latest records for this gym.'}
				</p>
			</div>
			<div className={styles.records} aria-hidden="true">
				<span className={styles.record}>
					<span className={styles.marker} />
					<span className={styles.line} />
				</span>
				<span className={styles.record}>
					<span className={styles.marker} />
					<span className={styles.line} />
				</span>
				<span className={styles.record}>
					<span className={styles.marker} />
					<span className={styles.line} />
				</span>
			</div>
		</div>
	);
}
