import { PageHeader } from '@/components/shared/page-header';

import styles from './page.module.css';

export default function Loading() {
	return (
		<div className={styles.page}>
			<PageHeader
				title="Payment report"
				description="Choose a date range to review payments recorded for your gym."
			/>
			<div className={styles.loading} role="status">
				Preparing payment report…
			</div>
		</div>
	);
}
