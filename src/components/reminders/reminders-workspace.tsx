'use client';

import {
	Call02Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Mail01Icon,
	Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

import { Button } from '@/components/shared/button';
import { Dialog } from '@/components/shared/dialog';
import { PageHeader } from '@/components/shared/page-header';

import styles from './reminders-workspace.module.css';

type Channel = 'SMS' | 'EMAIL';
type Filter = 'all' | 'urgent' | 'pending' | 'reminded';

interface ExpiringMember {
	readonly id: string;
	readonly name: string;
	readonly phone: string;
	readonly email: string | null;
	readonly plan: string;
	readonly expires: string;
	readonly daysLeft: number;
}

// Fictional snapshot as of 18 October 2026. These are never delivery destinations.
const members: readonly ExpiringMember[] = [
	{
		id: 'demo-1',
		name: 'Aline Uwase',
		phone: '+250 788 XXX 101',
		email: 'aline.uwase@example.com',
		plan: 'Monthly Fitness',
		expires: '2026-10-19',
		daysLeft: 1,
	},
	{
		id: 'demo-2',
		name: 'Eric Niyonsenga',
		phone: '+250 783 XXX 102',
		email: null,
		plan: 'Premium Monthly',
		expires: '2026-10-20',
		daysLeft: 2,
	},
	{
		id: 'demo-3',
		name: 'Claudine Mukamana',
		phone: '+250 722 XXX 103',
		email: 'claudine.mukamana@example.com',
		plan: 'Standard Monthly',
		expires: '2026-10-21',
		daysLeft: 3,
	},
	{
		id: 'demo-4',
		name: 'Jean Claude Habimana',
		phone: '+250 789 XXX 104',
		email: 'jean.habimana@example.com',
		plan: 'Premium Quarterly',
		expires: '2026-10-23',
		daysLeft: 5,
	},
	{
		id: 'demo-5',
		name: 'Sandrine Uwamahoro',
		phone: '+250 781 XXX 105',
		email: 'sandrine.uwamahoro@example.com',
		plan: 'Monthly Fitness',
		expires: '2026-10-25',
		daysLeft: 7,
	},
	{
		id: 'demo-6',
		name: 'Pacifique Nsengiyumva',
		phone: '+250 788 XXX 106',
		email: null,
		plan: 'Standard Monthly',
		expires: '2026-10-29',
		daysLeft: 11,
	},
	{
		id: 'demo-7',
		name: 'Diane Iradukunda',
		phone: '+250 783 XXX 107',
		email: 'diane.iradukunda@example.com',
		plan: 'Monthly Fitness',
		expires: '2026-10-31',
		daysLeft: 13,
	},
];

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Kigali',
});

function formattedDate(value: string) {
	return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

function reminderMessage(member: ExpiringMember, organizationName: string, channel: Channel) {
	const opening = channel === 'SMS' ? `Hi ${member.name},` : `Hello ${member.name},`;
	return `${opening}\n\nYour ${member.plan} membership at ${organizationName} expires on ${formattedDate(
		member.expires,
	)}. Please contact the gym to renew.\n\n${organizationName}`;
}

export function RemindersWorkspace({ organizationName }: { readonly organizationName: string }) {
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<Filter>('all');
	const [sent, setSent] = useState<Readonly<Record<string, readonly Channel[]>>>({});
	const [draft, setDraft] = useState<{ member: ExpiringMember; channel: Channel } | null>(null);
	const [message, setMessage] = useState('');
	const [confirmation, setConfirmation] = useState<string | null>(null);

	function wasSent(memberId: string, channel: Channel) {
		return (sent[memberId] ?? []).includes(channel);
	}

	function hasReminder(memberId: string) {
		return (sent[memberId] ?? []).length > 0;
	}

	function openMessage(member: ExpiringMember, channel: Channel) {
		if (wasSent(member.id, channel) || (channel === 'EMAIL' && member.email === null)) return;
		setMessage(reminderMessage(member, organizationName, channel));
		setDraft({ member, channel });
	}

	function confirmPreview() {
		if (draft === null || message.trim().length === 0 || wasSent(draft.member.id, draft.channel)) {
			return;
		}
		setSent((current) => ({
			...current,
			[draft.member.id]: [...(current[draft.member.id] ?? []), draft.channel],
		}));
		setConfirmation(
			`${draft.channel === 'SMS' ? 'SMS' : 'Email'} preview marked for ${draft.member.name}. No message was sent.`,
		);
		setDraft(null);
	}

	const normalized = search.trim().toLocaleLowerCase('en');
	const visibleMembers = members.filter((member) => {
		const matchesSearch =
			normalized.length === 0 ||
			[member.name, member.phone, member.plan, member.email ?? ''].some((value) =>
				value.toLocaleLowerCase('en').includes(normalized),
			);
		if (!matchesSearch) return false;
		if (filter === 'urgent') return member.daysLeft <= 3;
		if (filter === 'pending') return !hasReminder(member.id);
		if (filter === 'reminded') return hasReminder(member.id);
		return true;
	});

	return (
		<div className={styles.page}>
			<PageHeader
				title="Reminders"
				description="Review memberships approaching expiry and prepare a reminder."
			/>
			<p className={styles.demoNotice}>
				Static preview from 18 October 2026. These members and contacts are fictional; no SMS or
				email is sent or saved.
			</p>

			<section className={styles.workspace} aria-label="Members with expiring memberships">
				<div className={styles.toolbar}>
					<div className={styles.searchField}>
						<HugeiconsIcon icon={Search01Icon} size={18} aria-hidden="true" />
						<label htmlFor="reminder-search" className={styles.srOnly}>
							Search members
						</label>
						<input
							id="reminder-search"
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search members or plans"
						/>
					</div>
					<div className={styles.filterField}>
						<label htmlFor="reminder-filter">Status</label>
						<select
							id="reminder-filter"
							value={filter}
							onChange={(event) => setFilter(event.target.value as Filter)}
						>
							<option value="all">All</option>
							<option value="urgent">Within 3 days</option>
							<option value="pending">Not reminded</option>
							<option value="reminded">Marked in preview</option>
						</select>
					</div>
				</div>

				{confirmation !== null ? (
					<p className={styles.confirmation} role="status">
						{confirmation}
					</p>
				) : null}

				{visibleMembers.length === 0 ? (
					<div className={styles.empty}>
						<h2>No matching members</h2>
						<p>Try another search or status.</p>
					</div>
				) : (
					<div className={styles.tableScroll}>
						<table className={styles.table}>
							<caption className={styles.srOnly}>
								Fictional members with upcoming membership expiries, sorted by expiry date
							</caption>
							<thead>
								<tr>
									<th scope="col">Member</th>
									<th scope="col">Membership</th>
									<th scope="col">Expires</th>
									<th scope="col">Time left</th>
									<th scope="col">Status</th>
									<th scope="col">Actions</th>
								</tr>
							</thead>
							<tbody>
								{visibleMembers.map((member) => {
									const smsSent = wasSent(member.id, 'SMS');
									const emailSent = wasSent(member.id, 'EMAIL');
									return (
										<tr key={member.id}>
											<td>
												<div className={styles.member}>
													<strong>{member.name}</strong>
													<span>{member.phone}</span>
													{member.email ? <span>{member.email}</span> : null}
												</div>
											</td>
											<td>{member.plan}</td>
											<td>
												<time dateTime={member.expires}>{formattedDate(member.expires)}</time>
											</td>
											<td>{member.daysLeft === 1 ? '1 day' : `${member.daysLeft} days`}</td>
											<td>
												<span
													className={styles.status}
													data-status={hasReminder(member.id) ? 'marked' : 'pending'}
												>
													{smsSent && emailSent
														? 'SMS + email marked'
														: smsSent
															? 'SMS marked'
															: emailSent
																? 'Email marked'
																: 'Not reminded'}
												</span>
											</td>
											<td>
												<div className={styles.actions}>
													<Button
														icon={Call02Icon}
														variant="secondary"
														width="small"
														disabled={smsSent}
														onClick={() => openMessage(member, 'SMS')}
													>
														{smsSent ? 'SMS marked' : 'Send SMS'}
													</Button>
													<Button
														icon={Mail01Icon}
														variant="secondary"
														width="small"
														disabled={emailSent || member.email === null}
														title={
															member.email === null
																? 'No email address in this example'
																: undefined
														}
														onClick={() => openMessage(member, 'EMAIL')}
													>
														{emailSent ? 'Email marked' : 'Send email'}
													</Button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<Dialog
				open={draft !== null}
				onClose={() => setDraft(null)}
				title={draft?.channel === 'SMS' ? 'SMS reminder' : 'Email reminder'}
				description={draft ? `Message preview for ${draft.member.name}` : undefined}
				footer={
					<>
						<Button
							icon={Cancel01Icon}
							variant="secondary"
							width="small"
							onClick={() => setDraft(null)}
						>
							Cancel
						</Button>
						<Button
							icon={CheckmarkCircle02Icon}
							width="medium"
							disabled={message.trim().length === 0}
							onClick={confirmPreview}
						>
							Mark in preview
						</Button>
					</>
				}
			>
				<div className={styles.messageForm}>
					<p>
						<strong>To</strong>{' '}
						{draft?.channel === 'SMS' ? draft.member.phone : draft?.member.email}
					</p>
					<label htmlFor="reminder-message">Message</label>
					<textarea
						id="reminder-message"
						rows={7}
						value={message}
						onChange={(event) => setMessage(event.target.value)}
					/>
					<p className={styles.previewNote}>
						Preview only. Marking this reminder does not send or save a message.
					</p>
				</div>
			</Dialog>
		</div>
	);
}
