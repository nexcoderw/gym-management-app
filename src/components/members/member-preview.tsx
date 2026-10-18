import { Dialog } from '@/components/shared/dialog';
import type { ReactNode } from 'react';
import type { Member } from '@/lib/contracts';

import styles from './member-preview.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Kigali',
});

export function MemberPreview({
	member,
	onClose,
	children,
}: {
	readonly member: Member;
	readonly onClose: () => void;
	readonly children?: ReactNode;
}) {
	return (
		<Dialog open title={member.name} description="Member profile details" onClose={onClose}>
			<dl className={styles.details}>
				<div>
					<dt>Profile status</dt>
					<dd>{member.status === 'ACTIVE' ? 'Active' : 'Archived'}</dd>
				</div>

				<div>
					<dt>Phone number</dt>
					<dd>{member.phoneNumber}</dd>
				</div>

				<div>
					<dt>Email address</dt>
					<dd>{member.email ?? 'Not provided'}</dd>
				</div>

				<div>
					<dt>Registered</dt>
					<dd>{dateFormatter.format(new Date(member.createdAt))}</dd>
				</div>

				<div>
					<dt>Last updated</dt>
					<dd>{dateFormatter.format(new Date(member.updatedAt))}</dd>
				</div>

				{member.archivedAt !== null ? (
					<div>
						<dt>Archived</dt>
						<dd>{dateFormatter.format(new Date(member.archivedAt))}</dd>
					</div>
				) : null}
			</dl>
			{children}
		</Dialog>
	);
}
