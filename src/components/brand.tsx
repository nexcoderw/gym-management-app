import styles from './brand.module.css';

export function Brand() {
	return (
		<div className={styles.brand} aria-label="NEXCODE Gym">
			<span className={styles.mark} aria-hidden="true">
				N
			</span>
			<span>
				<strong>NEXCODE</strong>
				<small>Gym Portal</small>
			</span>
		</div>
	);
}
