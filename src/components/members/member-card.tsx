import type { Member } from '@/lib/contracts';

import styles from './member-card.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Kigali',
});

export function MemberCard({ member }: { readonly member: Member }) {
	return (
		<article className={styles.card}>
			<div className={styles.header}>
				<div className={styles.identity}>
					<span className={styles.avatar} aria-hidden="true">
						{member.name.trim().charAt(0).toUpperCase()}
					</span>

					<div className={styles.identityText}>
						<h2 className={styles.name}>{member.name}</h2>
						<span className={styles.status} data-status={member.status}>
							{member.status === 'ACTIVE' ? 'Active profile' : 'Archived profile'}
						</span>
					</div>
				</div>
			</div>

			<dl className={styles.details}>
				<div className={styles.detail}>
					<dt>Phone number</dt>
					<dd>{member.phoneNumber}</dd>
				</div>

				<div className={styles.detail}>
					<dt>Email address</dt>
					<dd>{member.email ?? 'Not provided'}</dd>
				</div>

				<div className={styles.detail}>
					<dt>Registered</dt>
					<dd>{dateFormatter.format(new Date(member.createdAt))}</dd>
				</div>

				{member.archivedAt !== null ? (
					<div className={styles.detail}>
						<dt>Archived</dt>
						<dd>{dateFormatter.format(new Date(member.archivedAt))}</dd>
					</div>
				) : null}
			</dl>
		</article>
	);
}
