'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Dialog } from '@/components/shared/dialog';
import type { Member } from '@/lib/contracts';
import styles from './member-preview.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Kigali',
});

const tabs = ['profile', 'memberships'] as const;
type Tab = (typeof tabs)[number];

function initialsOf(name: string) {
	return name
		.trim()
		.split(/\s+/u)
		.slice(0, 2)
		.map((word) => Array.from(word)[0] ?? '')
		.join('')
		.toLocaleUpperCase('en');
}

export function MemberPreview({
	member,
	onClose,
	children,
}: {
	readonly member: Member;
	readonly onClose: () => void;
	readonly children?: ReactNode;
}) {
	const [activeTab, setActiveTab] = useState<Tab>('profile');
	const [historyOpened, setHistoryOpened] = useState(false);
	const id = useId();
	const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

	function selectTab(tab: Tab) {
		setActiveTab(tab);
		if (tab === 'memberships') setHistoryOpened(true);
	}

	function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
		let nextIndex: number;
		switch (event.key) {
			case 'ArrowRight':
				nextIndex = (index + 1) % tabs.length;
				break;
			case 'ArrowLeft':
				nextIndex = (index + tabs.length - 1) % tabs.length;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = tabs.length - 1;
				break;
			default:
				return;
		}
		event.preventDefault();
		const nextTab = tabs[nextIndex];
		if (nextTab === undefined) return;
		selectTab(nextTab);
		tabRefs.current[nextIndex]?.focus();
	}

	return (
		<Dialog
			open
			size="wide"
			title={member.name}
			description="Member profile and membership history"
			onClose={onClose}
		>
			<div className={styles.preview}>
				<div className={styles.identity}>
					<span className={styles.avatar} aria-hidden="true">
						{initialsOf(member.name)}
					</span>
					<div className={styles.identityText}>
						<p className={styles.eyebrow}>Member profile</p>
						<h3>{member.name}</h3>
						<p className={styles.identityMeta}>
							Joined {dateFormatter.format(new Date(member.createdAt))}
						</p>
					</div>
					<span className={styles.status} data-status={member.status}>
						{member.status === 'ACTIVE' ? 'Active' : 'Archived'}
					</span>
				</div>

				<div className={styles.tabs} role="tablist" aria-label="Member details sections">
					{tabs.map((tab, index) => (
						<button
							key={tab}
							ref={(element) => {
								tabRefs.current[index] = element;
							}}
							type="button"
							role="tab"
							id={`${id}-${tab}-tab`}
							aria-controls={`${id}-${tab}-panel`}
							aria-selected={activeTab === tab}
							tabIndex={activeTab === tab ? 0 : -1}
							onClick={() => selectTab(tab)}
							onKeyDown={(event) => handleTabKeyDown(event, index)}
						>
							{tab === 'profile' ? 'Profile' : 'Memberships'}
						</button>
					))}
				</div>

				<div
					className={styles.panel}
					role="tabpanel"
					id={`${id}-profile-panel`}
					aria-labelledby={`${id}-profile-tab`}
					hidden={activeTab !== 'profile'}
					tabIndex={activeTab === 'profile' ? 0 : -1}
				>
					<div className={styles.sectionHeading}>
						<h4>Contact information</h4>
						<p>How to reach this member</p>
					</div>
					<dl className={styles.details}>
						<div>
							<dt>Phone number</dt>
							<dd>{member.phoneNumber}</dd>
						</div>
						<div>
							<dt>Email address</dt>
							<dd>{member.email ?? 'Not provided'}</dd>
						</div>
					</dl>
					<div className={styles.sectionHeading}>
						<h4>Profile record</h4>
						<p>Registration and account dates</p>
					</div>
					<dl className={styles.details}>
						<div>
							<dt>Profile status</dt>
							<dd>{member.status === 'ACTIVE' ? 'Active' : 'Archived'}</dd>
						</div>
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
						{member.archivedAt !== null ? (
							<div>
								<dt>Archived</dt>
								<dd>
									<time dateTime={member.archivedAt}>
										{dateFormatter.format(new Date(member.archivedAt))}
									</time>
								</dd>
							</div>
						) : null}
					</dl>
				</div>
				<div
					className={styles.panel}
					role="tabpanel"
					id={`${id}-memberships-panel`}
					aria-labelledby={`${id}-memberships-tab`}
					hidden={activeTab !== 'memberships'}
					tabIndex={activeTab === 'memberships' ? 0 : -1}
				>
					{historyOpened ? children : null}
				</div>
			</div>
		</Dialog>
	);
}
