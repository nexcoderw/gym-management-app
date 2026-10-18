import { PortalShell } from '@/components/auth/portal-shell';
import styles from './loading.module.css';

export default function Loading() {
	return (
		<PortalShell>
			<div className={styles.loading} role="status">
				<span aria-hidden="true" />
				<strong>Opening your portal</strong>
				<small>Verifying secure access…</small>
			</div>
		</PortalShell>
	);
}
