import { Archive02Icon, Edit02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

import type { Member } from '@/lib/contracts';
import { Button } from '@/components/shared/button';

import styles from './member-card.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Kigali',
});

function initialsOf(name: string) {
	return name
		.trim()
		.split(/\s+/u)
		.slice(0, 2)
		.map((word) => Array.from(word)[0] ?? '')
		.join('')
		.toLocaleUpperCase('en');
}

export function MemberCard({
	member,
	onOpen,
	onEdit,
	onArchive,
}: {
	readonly member: Member;
	readonly onOpen: (member: Member) => void;
	readonly onEdit: (member: Member) => void;
	readonly onArchive: (member: Member) => void;
}) {
	const nameId = `member-${member.id}-name`;

	return (
		<article className={styles.card} aria-labelledby={nameId}>
			<div className={styles.top}>
				<span className={styles.avatar} aria-hidden="true">
					{initialsOf(member.name)}
				</span>

				<span className={styles.status} data-status={member.status}>
					{member.status === 'ACTIVE' ? 'Active' : 'Archived'}
				</span>
			</div>

			<div className={styles.identity}>
				<h2 id={nameId} className={styles.name}>
					<button
						type="button"
						className={styles.open}
						aria-haspopup="dialog"
						onClick={() => onOpen(member)}
					>
						{member.name}
					</button>
				</h2>

				<p className={styles.phone}>{member.phoneNumber}</p>
			</div>

			<dl className={styles.meta}>
				<div>
					<dt>Registered</dt>
					<dd>
						<time dateTime={member.createdAt}>
							{dateFormatter.format(new Date(member.createdAt))}
						</time>
					</dd>
				</div>

				<div>
					<dt>Last updated</dt>
					<dd>
						<time dateTime={member.updatedAt}>
							{dateFormatter.format(new Date(member.updatedAt))}
						</time>
					</dd>
				</div>
			</dl>

			<div className={styles.footer}>
				{member.status === 'ACTIVE' ? (
					<>
						<Button
							icon={Edit02Icon}
							iconOnly
							variant="secondary"
							onClick={() => onEdit(member)}
							aria-label={`Edit ${member.name}`}
						>
							Edit member
						</Button>
						<Button
							icon={Archive02Icon}
							iconOnly
							variant="secondary"
							onClick={() => onArchive(member)}
							aria-label={`Archive ${member.name}`}
						>
							Archive member
						</Button>
					</>
				) : null}
				<Button
					icon={ArrowRight01Icon}
					variant="secondary"
					width="small"
					onClick={() => onOpen(member)}
					aria-label={`Details for ${member.name}`}
				>
					Details
				</Button>
			</div>
		</article>
	);
}
