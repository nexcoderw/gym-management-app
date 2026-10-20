'use client';

import {
	ArrowRight01Icon,
	Cancel01Icon,
	Mail01Icon,
	RefreshIcon,
} from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ButtonLink } from '@/components/shared/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { routes } from '@/constants/routes';
import type { ReminderActivityItem } from '@/lib/contracts';

import {
	RemindersToolbar,
	type ReminderOrder,
	type ReminderStatusFilter,
} from './reminders-toolbar';
import styles from './reminders-workspace.module.css';

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
	const [status, setStatus] = useState<ReminderStatusFilter>('ALL');
	const [order, setOrder] = useState<ReminderOrder>('NEWEST');
	const query = search.trim().toLocaleLowerCase('en');
	const visible = items
		.filter(
			(item) =>
				(status === 'ALL' || item.status === status) &&
				(query === '' ||
					[item.memberName, item.planName].some((value) =>
						value.toLocaleLowerCase('en').includes(query),
					)),
		)
		.sort((left, right) =>
			order === 'NEWEST'
				? right.dueDate.localeCompare(left.dueDate)
				: left.dueDate.localeCompare(right.dueDate),
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
					errorStatus === null && items.length > 0 ? (
						<Button icon={RefreshIcon} variant="secondary" pending={refreshing} onClick={refresh}>
							Refresh
						</Button>
					) : undefined
				}
			/>
			{errorStatus !== null ? (
				<EmptyState
					icon={Mail01Icon}
					role="alert"
					title={
						errorStatus === 401
							? 'Your session has expired'
							: errorStatus === 403
								? 'Reminder activity is restricted'
								: 'Reminder activity unavailable'
					}
					description={
						errorStatus === 401
							? 'Sign in again to view reminder activity.'
							: errorStatus === 403
								? 'An active gym owner account is required to view this activity.'
								: errorStatus === 429
									? 'Too many requests. Wait a moment before refreshing.'
									: 'We could not load reminder activity. Please try again.'
					}
					action={
						errorStatus === 401 ? (
							<ButtonLink href={routes.login} icon={ArrowRight01Icon} variant="primary">
								Open sign in
							</ButtonLink>
						) : errorStatus === 403 || errorStatus === 429 ? undefined : (
							<Button icon={RefreshIcon} pending={refreshing} onClick={refresh}>
								Refresh activity
							</Button>
						)
					}
				/>
			) : (
				<section className={styles.workspace} aria-label="Email reminder activity">
					{items.length > 0 ? (
						<RemindersToolbar
							count={visible.length}
							total={items.length}
							term={search}
							status={status}
							order={order}
							onTermChange={setSearch}
							onFiltersApply={(nextStatus, nextOrder) => {
								setStatus(nextStatus);
								setOrder(nextOrder);
							}}
						/>
					) : null}
					{visible.length === 0 ? (
						<EmptyState
							icon={Mail01Icon}
							title={items.length === 0 ? 'No reminder activity yet' : 'No matching reminders'}
							description={
								items.length === 0
									? 'Automatic email reminders will appear here after the scheduler and sender run.'
									: 'Try a different search or status.'
							}
							action={
								items.length === 0 ? (
									<Button icon={RefreshIcon} pending={refreshing} onClick={refresh}>
										Refresh activity
									</Button>
								) : (
									<Button
										icon={Cancel01Icon}
										variant="secondary"
										onClick={() => {
											setSearch('');
											setStatus('ALL');
											setOrder('NEWEST');
										}}
									>
										Clear filters
									</Button>
								)
							}
						/>
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
					{items.length > 0 ? (
						<p className={styles.note}>
							Submitted means the email provider accepted the message; it does not confirm inbox
							delivery. Showing the 50 most recent reminder occasions.
						</p>
					) : null}
				</section>
			)}
		</div>
	);
}
