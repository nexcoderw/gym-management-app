import { PageHeader } from '@/components/shared/page-header';
import styles from './section-placeholder.module.css';

export function SectionPlaceholder({
	title,
	description,
}: {
	readonly title: string;
	readonly description: string;
}) {
	return (
		<div className={styles.page}>
			<PageHeader title={title} description={description} />
			<section className={styles.panel} aria-labelledby="workspace-status-title">
				<span className={styles.eyebrow}>Workspace status</span>
				<h2 id="workspace-status-title">No information to review yet</h2>
				<p>Verified organization information will appear here when this workspace is enabled.</p>
			</section>
		</div>
	);
}
