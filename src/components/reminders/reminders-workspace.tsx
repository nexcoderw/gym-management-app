'use client';

import { RefreshIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/shared/button';
import { PageHeader } from '@/components/shared/page-header';
import { routes } from '@/constants/routes';
import type { ReminderActivityItem } from '@/lib/contracts';

import styles from './reminders-workspace.module.css';

type StatusFilter = 'ALL' | ReminderActivityItem['status'];

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Kigali',
});

function formattedDate(value: string): string {
	return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

function occasionLabel(kind: ReminderActivityItem['kind']): string {
	return kind === 'THREE_DAYS_BEFORE' ? 'Three days before' : 'Expiry day';
}

function statusLabel(status: ReminderActivityItem['status']): string {
	switch (status) {
		case 'ACCEPTED':
			return 'Submitted to email provider';
		case 'DELIVERED':
			return 'Delivered';
		case 'BOUNCED':
			return 'Bounced';
		case 'FAILED':
			return 'Delivery failed';
		case 'UNCERTAIN':
			return 'Needs review';
	}
}

function isStatusFilter(value: string): value is StatusFilter {
	return (
		value === 'ALL' ||
		value === 'ACCEPTED' ||
		value === 'DELIVERED' ||
		value === 'BOUNCED' ||
		value === 'FAILED' ||
		value === 'UNCERTAIN'
	);
}

export function RemindersWorkspace({
	items,
	errorStatus,
}: {
	readonly items: readonly ReminderActivityItem[];
	readonly errorStatus: number | null;
}) {
	const router = useRouter();
	const [refreshing, startRefresh] = useTransition();
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<StatusFilter>('ALL');
	const query = search.trim().toLocaleLowerCase('en');
	const visible = items.filter(
		(item) =>
			(status === 'ALL' || item.status === status) &&
			(query === '' ||
				[item.memberName, item.planName].some((value) =>
					value.toLocaleLowerCase('en').includes(query),
				)),
	);

	function refresh() {
		startRefresh(() => router.refresh());
	}

	return (
		<div className={styles.page}>
			<PageHeader
				title="Reminders"
				description="Review automatic membership-expiry email activity for this gym."
				actions={
					<Button icon={RefreshIcon} variant="secondary" pending={refreshing} onClick={refresh}>
						Refresh
					</Button>
				}
			/>
			{errorStatus !== null ? (
				<section className={styles.empty} role="alert" aria-labelledby="reminder-error-title">
					<h2 id="reminder-error-title">
						{errorStatus === 401
							? 'Your session has expired'
							: errorStatus === 403
								? 'Reminder activity is restricted'
								: 'Reminder activity unavailable'}
					</h2>
					<p>
						{errorStatus === 401
							? 'Sign in again to view reminder activity.'
							: errorStatus === 403
								? 'An active gym owner account is required to view this activity.'
								: errorStatus === 429
									? 'Too many requests. Wait a moment before refreshing.'
									: 'We could not load reminder activity. Please try again.'}
					</p>
					{errorStatus === 401 ? <Link href={routes.login}>Open sign in</Link> : null}
				</section>
			) : (
				<section className={styles.workspace} aria-label="Email reminder activity">
					{items.length > 0 ? (
						<div className={styles.toolbar}>
							<div className={styles.searchField}>
								<HugeiconsIcon icon={Search01Icon} size={18} aria-hidden="true" />
								<label htmlFor="reminder-search" className={styles.srOnly}>
									Search reminder activity
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
									value={status}
									onChange={(event) => {
										const next = event.target.value;
										if (isStatusFilter(next)) setStatus(next);
									}}
								>
									<option value="ALL">All</option>
									<option value="ACCEPTED">Submitted</option>
									<option value="DELIVERED">Delivered</option>
									<option value="BOUNCED">Bounced</option>
									<option value="FAILED">Failed</option>
									<option value="UNCERTAIN">Needs review</option>
								</select>
							</div>
						</div>
					) : null}
					{visible.length === 0 ? (
						<div className={styles.empty}>
							<h2>{items.length === 0 ? 'No reminder activity yet' : 'No matching reminders'}</h2>
							<p>
								{items.length === 0
									? 'Automatic email reminders will appear here after the scheduler and sender run.'
									: 'Try a different search or status.'}
							</p>
						</div>
					) : (
						<div className={styles.tableScroll}>
							<table className={styles.table}>
								<caption className={styles.srOnly}>
									Recent automatic email reminder delivery activity
								</caption>
								<thead>
									<tr>
										<th scope="col">Member</th>
										<th scope="col">Membership</th>
										<th scope="col">Occasion</th>
										<th scope="col">Expires</th>
										<th scope="col">Due</th>
										<th scope="col">Delivery status</th>
									</tr>
								</thead>
								<tbody>
									{visible.map((item) => (
										<tr key={item.id}>
											<td>
												<strong>{item.memberName}</strong>
											</td>
											<td>{item.planName}</td>
											<td>{occasionLabel(item.kind)}</td>
											<td>
												<time dateTime={item.endDate}>{formattedDate(item.endDate)}</time>
											</td>
											<td>
												<time dateTime={item.dueDate}>{formattedDate(item.dueDate)}</time>
											</td>
											<td>
												<span className={styles.status} data-status={item.status}>
													{statusLabel(item.status)}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
					<p className={styles.note}>
						Submitted means the email provider accepted the message; it does not confirm inbox
						delivery. Showing the 50 most recent reminder occasions.
					</p>
				</section>
			)}
		</div>
	);
}
