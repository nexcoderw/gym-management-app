import styles from './brand.module.css';

export function Brand({ organizationName }: { organizationName: string }) {
	const initials = organizationInitials(organizationName);

	return (
		<div className={styles.brand} aria-label={`${organizationName} organization portal`}>
			<span className={styles.mark} aria-hidden="true">
				{initials}
			</span>
			<span className={styles.identity}>
				<strong>{organizationName}</strong>
				<small>Organization portal</small>
			</span>
		</div>
	);
}

function organizationInitials(name: string): string {
	const words = name.trim().split(/\s+/u).filter(Boolean);
	if (words.length === 0) return 'GY';
	const first = Array.from(words[0] ?? '')[0] ?? '';
	const lastWord = words.length > 1 ? (words.at(-1) ?? '') : (words[0] ?? '');
	const lastCharacters = Array.from(lastWord);
	const second = words.length > 1 ? (lastCharacters[0] ?? '') : (lastCharacters[1] ?? '');
	return `${first}${second}`.toLocaleUpperCase();
}
