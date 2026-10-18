import type { ReactNode } from 'react';

import styles from './page-header.module.css';

export function PageHeader({
	title,
	description,
	actions,
}: {
	readonly title: string;
	readonly description: string;
	readonly actions?: ReactNode;
}) {
	return (
		<header className={styles.header}>
			<div className={styles.text}>
				<h1>{title}</h1>
				<p>{description}</p>
			</div>
			{actions ? <div className={styles.actions}>{actions}</div> : null}
		</header>
	);
}
