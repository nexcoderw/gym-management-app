import { LogoutButton } from '@/components/auth/logout-button';
import { WorkspaceBreadcrumb } from './workspace-breadcrumb';
import styles from './navbar.module.css';

export function Navbar({
	displayName,
	organizationName,
	className = '',
}: {
	readonly displayName: string;
	readonly organizationName: string;
	readonly className?: string;
}) {
	return (
		<header className={`${styles.navbar} ${className}`}>
			<div className={styles.location}>
				<WorkspaceBreadcrumb organizationName={organizationName} />
			</div>
			<div className={styles.account}>
				<div className={styles.identity}>
					<p className={styles.name}>{displayName}</p>
					<p className={styles.label}>Gym owner</p>
				</div>
				<LogoutButton />
			</div>
		</header>
	);
}
