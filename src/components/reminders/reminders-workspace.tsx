'use client';

import { ArrowRight01Icon, Cancel01Icon, Mail01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button, ButtonLink } from '@/components/shared/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Toast, type ToastNotice } from '@/components/shared/toast';
import { routes } from '@/constants/routes';
import {
	queuedReminderSchema,
	upcomingReminderSchema,
	type ManualReminderInput,
	type ReminderActivityItem,
	type UpcomingReminderItem,
} from '@/lib/contracts';

import { ReminderComposeDialog } from './reminder-compose-dialog';
import { RemindersToolbar, type ReminderOrder, type ReminderStatusFilter } from './reminders-toolbar';
import styles from './reminders-workspace.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Kigali',
});

function formattedDate(value: string): string {
	return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

function occasionLabel(kind: ReminderActivityItem['kind']): string {
	if (kind === 'THREE_DAYS_BEFORE') return 'Three days before';
	if (kind === 'EXPIRY_DAY') return 'Expiry day';
	return 'Sent by owner';
}

function statusLabel(status: ReminderActivityItem['status']): string {
	switch (status) {
		case 'ACCEPTED': return 'Submitted to email provider';
		case 'DELIVERED': return 'Delivered';
		case 'BOUNCED': return 'Bounced';
		case 'FAILED': return 'Delivery failed';
		case 'UNCERTAIN': return 'Needs review';
	}
}

function matchesStatus(item: UpcomingReminderItem, status: ReminderStatusFilter): boolean {
	if (status === 'ALL') return true;
	if (status === 'READY') return item.canSend;
	if (status === 'QUEUED') return item.manualStatus === 'QUEUED' || item.manualStatus === 'PROCESSING';
	if (status === 'SENT') return item.manualStatus === 'ACCEPTED' || item.manualStatus === 'DELIVERED';
	return !item.canSend && (item.manualStatus === null || ['BOUNCED', 'FAILED', 'UNCERTAIN', 'SKIPPED'].includes(item.manualStatus));
}

async function readError(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { message?: unknown };
		if (typeof body.message === 'string' && body.message.trim() !== '') return body.message;
	} catch { /* Keep the safe fallback. */ }
	return response.status === 409
		? 'A reminder already exists or this membership is no longer eligible. Refresh to see its latest status.'
		: 'The email could not be submitted. Please try again.';
}

export function RemindersWorkspace({
	items,
	errorStatus,
	upcoming: initialUpcoming = [],
	nextCursor: initialNextCursor = null,
	upcomingErrorStatus = null,
}: {
	readonly items: readonly ReminderActivityItem[];
	readonly errorStatus: number | null;
	readonly upcoming?: readonly UpcomingReminderItem[];
	readonly nextCursor?: string | null;
	readonly upcomingErrorStatus?: number | null;
}) {
	const router = useRouter();
	const [refreshing, startRefresh] = useTransition();
	const [upcoming, setUpcoming] = useState<readonly UpcomingReminderItem[]>(initialUpcoming);
	const [nextCursor, setNextCursor] = useState(initialNextCursor);
	const [loadingMore, setLoadingMore] = useState(false);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<ReminderStatusFilter>('ALL');
	const [order, setOrder] = useState<ReminderOrder>('SOONEST');
	const [selected, setSelected] = useState<UpcomingReminderItem | null>(null);
	const [sending, setSending] = useState(false);
	const [notice, setNotice] = useState<ToastNotice | null>(null);
	const dismissNotice = useCallback(() => setNotice(null), []);
	const query = search.trim().toLocaleLowerCase('en');
	const visible = [...upcoming]
		.filter((item) => matchesStatus(item, status) && (query === '' || [item.memberName, item.planName].some((value) => value.toLocaleLowerCase('en').includes(query))))
		.sort((left, right) => order === 'SOONEST'
			? left.endDate.localeCompare(right.endDate) || left.subscriptionId.localeCompare(right.subscriptionId)
			: right.endDate.localeCompare(left.endDate) || right.subscriptionId.localeCompare(left.subscriptionId));

	function refresh() { startRefresh(() => router.refresh()); }

	async function loadMore() {
		if (nextCursor === null || loadingMore) return;
		setLoadingMore(true);
		try {
			const response = await fetch(`/api/reminders/upcoming?cursor=${encodeURIComponent(nextCursor)}`, { credentials: 'same-origin', cache: 'no-store' });
			if (!response.ok) throw new Error(await readError(response));
			const parsed = upcomingReminderSchema.safeParse(await response.json());
			if (!parsed.success) throw new Error('The reminder list could not be verified.');
			const page = parsed.data;
			setUpcoming((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.subscriptionId === item.subscriptionId))]);
			setNextCursor(page.nextCursor);
		} catch (error: unknown) {
			setNotice({ id: Date.now(), tone: 'error', message: error instanceof Error ? error.message : 'Could not load more members.' });
		} finally { setLoadingMore(false); }
	}

	async function sendReminder(input: ManualReminderInput) {
		if (selected === null || sending) return;
		const subscriptionId = selected.subscriptionId;
		setSending(true);
		try {
			const response = await fetch(`/api/reminders/subscriptions/${encodeURIComponent(subscriptionId)}/deliveries`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
				credentials: 'same-origin',
				cache: 'no-store',
			});
			if (!response.ok) throw new Error(await readError(response));
			if (!queuedReminderSchema.safeParse(await response.json()).success) {
				throw new Error('The reminder response could not be verified. Refresh before retrying.');
			}
			setUpcoming((current) => current.map((item) => item.subscriptionId === subscriptionId ? { ...item, canSend: false, manualStatus: 'QUEUED' } : item));
			setSelected(null);
			setNotice({ id: Date.now(), tone: 'success', message: 'Email reminder queued for delivery. Check recent activity for its status.' });
		} catch (error: unknown) {
			setNotice({ id: Date.now(), tone: 'error', message: error instanceof Error ? error.message : 'Could not submit the email.' });
		} finally { setSending(false); }
	}

	return (
		<div className={styles.page}>
			<PageHeader title="Reminders" description="Review memberships expiring in the next 14 days and email delivery activity." actions={upcomingErrorStatus === null && upcoming.length > 0 ? <Button icon={RefreshIcon} variant="secondary" pending={refreshing} onClick={refresh}>Refresh</Button> : undefined} />
			<section className={styles.workspace} aria-label="Expiring memberships">
				{upcomingErrorStatus !== null ? (
					<EmptyState icon={Mail01Icon} role="alert" title={upcomingErrorStatus === 401 ? 'Your session has expired' : 'Expiring memberships unavailable'} description={upcomingErrorStatus === 401 ? 'Sign in again to view upcoming expiries.' : 'We could not load upcoming expiries. Please try again.'} action={upcomingErrorStatus === 401 ? <ButtonLink href={routes.login} icon={ArrowRight01Icon}>Open sign in</ButtonLink> : <Button icon={RefreshIcon} pending={refreshing} onClick={refresh}>Refresh</Button>} />
				) : (
					<>
						{upcoming.length > 0 ? <RemindersToolbar count={visible.length} total={upcoming.length} term={search} status={status} order={order} onTermChange={setSearch} onFiltersApply={(nextStatus, nextOrder) => { setStatus(nextStatus); setOrder(nextOrder); }} /> : null}
						{visible.length === 0 ? <EmptyState icon={Mail01Icon} title={upcoming.length === 0 ? 'No memberships nearing expiry' : 'No matching members'} description={upcoming.length === 0 ? 'Memberships ending within the next 14 days will appear here.' : 'Try another search or filter.'} action={upcoming.length === 0 ? <Button icon={RefreshIcon} pending={refreshing} onClick={refresh}>Refresh reminders</Button> : <Button icon={Cancel01Icon} variant="secondary" onClick={() => { setSearch(''); setStatus('ALL'); setOrder('SOONEST'); }}>Clear filters</Button>} /> : (
							<div className={styles.tableScroll}><table className={styles.table}><caption className={styles.srOnly}>Memberships ending in the next 14 days</caption><thead><tr><th scope="col">Member</th><th scope="col">Membership</th><th scope="col">Expires</th><th scope="col">Time left</th><th scope="col">Reminder</th><th scope="col">Action</th></tr></thead><tbody>{visible.map((item) => <tr key={item.subscriptionId}><td><strong>{item.memberName}</strong></td><td>{item.planName}</td><td><time dateTime={item.endDate}>{formattedDate(item.endDate)}</time></td><td>{item.daysRemaining === 0 ? 'Today' : `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'}`}</td><td><span className={styles.status} data-status={item.manualStatus ?? 'NONE'}>{item.manualStatus === null ? item.canSend ? 'Ready' : 'Email unavailable' : item.manualStatus === 'QUEUED' || item.manualStatus === 'PROCESSING' ? 'Queued' : item.manualStatus === 'ACCEPTED' || item.manualStatus === 'DELIVERED' ? 'Submitted' : 'Review activity'}</span></td><td>{item.canSend ? <Button icon={Mail01Icon} width="small" onClick={() => setSelected(item)}>Send reminder</Button> : <span className={styles.muted}>—</span>}</td></tr>)}</tbody></table></div>
						)}
						{nextCursor !== null ? <div className={styles.loadMore}><Button icon={ArrowRight01Icon} variant="secondary" pending={loadingMore} onClick={() => void loadMore()}>Load more</Button></div> : null}
					</>
				)}
			</section>
			<section className={styles.workspace} aria-label="Recent email reminder activity">
				<h2 className={styles.sectionTitle}>Recent email activity</h2>
				{errorStatus !== null ? <p className={styles.note} role="alert">Recent delivery activity could not be loaded. Refresh to try again.</p> : items.length === 0 ? <p className={styles.note}>No reminders have been submitted to the email provider yet.</p> : (
					<><div className={styles.tableScroll}><table className={styles.table}><caption className={styles.srOnly}>Recent reminder delivery activity</caption><thead><tr><th scope="col">Member</th><th scope="col">Membership</th><th scope="col">Occasion</th><th scope="col">Expires</th><th scope="col">Due</th><th scope="col">Delivery status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.memberName}</strong></td><td>{item.planName}</td><td>{occasionLabel(item.kind)}</td><td><time dateTime={item.endDate}>{formattedDate(item.endDate)}</time></td><td><time dateTime={item.dueDate}>{formattedDate(item.dueDate)}</time></td><td><span className={styles.status} data-status={item.status}>{statusLabel(item.status)}</span></td></tr>)}</tbody></table></div><p className={styles.note}>Submitted means the email provider accepted the message; it does not confirm inbox delivery. Showing the 50 most recent occasions.</p></>
				)}
			</section>
			{selected !== null ? (
				<ReminderComposeDialog
					key={selected.subscriptionId}
					member={selected}
					pending={sending}
					onClose={() => setSelected(null)}
					onSend={sendReminder}
				/>
			) : null}
			{notice ? <Toast key={notice.id} notice={notice} onDismiss={dismissNotice} /> : null}
		</div>
	);
}
