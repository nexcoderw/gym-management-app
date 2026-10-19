import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ReactNode } from 'react';

import styles from './empty-state.module.css';

interface EmptyStateProps {
	readonly icon: IconSvgElement;
	readonly title: string;
	readonly description: ReactNode;
	readonly action?: ReactNode;
	readonly role?: 'alert' | 'status';
}

/** Shared presentation only; each feature owns its empty/error copy and next action. */
export function EmptyState({ icon, title, description, action, role }: EmptyStateProps) {
	return (
		<div className={styles.root} role={role}>
			<span className={styles.icon} aria-hidden="true">
				<HugeiconsIcon icon={icon} size={28} strokeWidth={1.7} />
			</span>
			<h2 className={styles.title}>{title}</h2>
			<p className={styles.description}>{description}</p>
			{action ? <div className={styles.action}>{action}</div> : null}
		</div>
	);
}
