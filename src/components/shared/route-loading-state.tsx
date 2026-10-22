import styles from './route-loading-state.module.css';

interface RouteLoadingStateProps {
	readonly title: string;
	readonly subject: string;
	readonly compact?: boolean;
}

export function RouteLoadingState({ title, subject, compact = false }: RouteLoadingStateProps) {
	return (
		<section
			className={styles.root}
			data-compact={compact || undefined}
			role="status"
			aria-live="polite"
		>
			<h1>{title}</h1>
			<p>Loading {subject}…</p>
			<span className={styles.track} aria-hidden="true" />
		</section>
	);
}
