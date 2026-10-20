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
			<span className={styles.icon} aria-hidden="true">
				<HugeiconsIcon icon={Search01Icon} size={25} strokeWidth={1.6} />
			</span>
			<h2>{searching ? `Searching ${subject}` : `Loading ${subject}`}</h2>
			<span className={styles.scan} aria-hidden="true" />
		</div>
	);
}
