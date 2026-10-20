'use client';

import {
	ArrowRight01Icon,
	Cancel01Icon,
	Mail01Icon,
	RefreshIcon,
} from '@hugeicons/core-free-icons';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button, ButtonLink } from '@/components/shared/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { Toast, type ToastNotice } from '@/components/shared/toast';
import { routes } from '@/constants/routes';
import {
	queuedReminderSchema,
	upcomingReminderSchema,
	type ManualReminderInput,
	type UpcomingReminderItem,
} from '@/lib/contracts';

import { ReminderComposeDialog } from './reminder-compose-dialog';
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

function matchesStatus(item: UpcomingReminderItem, status: ReminderStatusFilter): boolean {
	if (status === 'ALL') return true;
	if (status === 'READY') return item.canSend;
	if (status === 'QUEUED')
		return item.manualStatus === 'QUEUED' || item.manualStatus === 'PROCESSING';
	if (status === 'SENT')
		return item.manualStatus === 'ACCEPTED' || item.manualStatus === 'DELIVERED';
	return (
		!item.canSend &&
		(item.manualStatus === null ||
			['BOUNCED', 'FAILED', 'UNCERTAIN', 'SKIPPED'].includes(item.manualStatus))
	);
}

async function readError(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { message?: unknown };
		if (typeof body.message === 'string' && body.message.trim() !== '') return body.message;
	} catch {
		/* Keep the safe fallback. */
	}
	return response.status === 409
		? 'A reminder already exists or this membership is no longer eligible. Refresh to see its latest status.'
		: 'The email could not be submitted. Please try again.';
}

export function RemindersWorkspace({
	upcoming: initialUpcoming = [],
	nextCursor: initialNextCursor = null,
	upcomingErrorStatus = null,
}: {
	readonly upcoming?: readonly UpcomingReminderItem[];
	readonly nextCursor?: string | null;
	readonly upcomingErrorStatus?: number | null;
}) {
	const router = useRouter();
	const [refreshing, startRefresh] = useTransition();
	const [upcoming, setUpcoming] = useState<readonly UpcomingReminderItem[]>(initialUpcoming);
	const [nextCursor, setNextCursor] = useState(initialNextCursor);
	const [currentPage, setCurrentPage] = useState(1);
	const [loadingMore, setLoadingMore] = useState(false);
	const [loadError, setLoadError] = useState(false);
	const [search, setSearch] = useState('');
	const appliedSearch = useRef('');
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const activeController = useRef<AbortController | null>(null);
	const requestNumber = useRef(0);
	const [status, setStatus] = useState<ReminderStatusFilter>('ALL');
	const [order, setOrder] = useState<ReminderOrder>('SOONEST');
	const [selected, setSelected] = useState<UpcomingReminderItem | null>(null);
	const [sending, setSending] = useState(false);
	const [notice, setNotice] = useState<ToastNotice | null>(null);
	const dismissNotice = useCallback(() => setNotice(null), []);
	const visible = [...upcoming]
		.filter((item) => matchesStatus(item, status))
		.sort((left, right) =>
			order === 'SOONEST'
				? left.endDate.localeCompare(right.endDate) ||
					left.subscriptionId.localeCompare(right.subscriptionId)
				: right.endDate.localeCompare(left.endDate) ||
					right.subscriptionId.localeCompare(left.subscriptionId),
		);
	const loadedPages = Math.max(1, Math.ceil(visible.length / 24));
	const displayedPage = Math.min(currentPage, loadedPages);
	const pageItems = visible.slice((displayedPage - 1) * 24, displayedPage * 24);
	useEffect(
		() => () => {
			if (searchTimer.current !== null) clearTimeout(searchTimer.current);
			activeController.current?.abort();
		},
		[],
	);

	function refresh() {
		startRefresh(() => router.refresh());
	}

	async function loadUpcoming(search: string, append = false) {
		if (append && (nextCursor === null || loadingMore)) return;
		activeController.current?.abort();
		const controller = new AbortController();
		activeController.current = controller;
		const request = ++requestNumber.current;
		setLoadingMore(true);
		if (!append) setLoadError(false);
		try {
			const query = new URLSearchParams();
			if (search) query.set('search', search);
			if (append && nextCursor !== null) query.set('cursor', nextCursor);
			const response = await fetch(`/api/reminders/upcoming?${query}`, {
				credentials: 'same-origin',
				cache: 'no-store',
				signal: controller.signal,
			});
			if (!response.ok) throw new Error(await readError(response));
			const parsed = upcomingReminderSchema.safeParse(await response.json());
			if (!parsed.success) throw new Error('The reminder list could not be verified.');
			if (request !== requestNumber.current) return;
			const page = parsed.data;
			const nextItems = append
				? [
						...upcoming,
						...page.items.filter(
							(item) =>
								!upcoming.some((existing) => existing.subscriptionId === item.subscriptionId),
						),
					]
				: page.items;
			setUpcoming(nextItems);
			setNextCursor(page.nextCursor);
			setCurrentPage(
				append
					? Math.max(
							1,
							Math.ceil(nextItems.filter((item) => matchesStatus(item, status)).length / 24),
						)
					: 1,
			);
		} catch (error: unknown) {
			if (controller.signal.aborted || request !== requestNumber.current) return;
			if (!append) {
				setUpcoming([]);
				setNextCursor(null);
				setCurrentPage(1);
				setLoadError(true);
			}
			setNotice({
				id: Date.now(),
				tone: 'error',
				message: error instanceof Error ? error.message : 'Could not load reminders.',
			});
		} finally {
			if (request === requestNumber.current) {
				setLoadingMore(false);
				activeController.current = null;
			}
		}
	}

	function changeSearch(value: string) {
		setSearch(value);
		setCurrentPage(1);
		if (searchTimer.current !== null) clearTimeout(searchTimer.current);
		const next = value.trim().length >= 3 ? value.trim() : '';
		if (next === appliedSearch.current) return;
		searchTimer.current = setTimeout(() => {
			appliedSearch.current = next;
			void loadUpcoming(next);
		}, 250);
	}

	function changePage(page: number) {
		if (page <= loadedPages) {
			setCurrentPage(page);
		} else if (page === loadedPages + 1 && nextCursor !== null) {
			void loadUpcoming(appliedSearch.current, true);
		}
	}

	async function sendReminder(input: ManualReminderInput) {
		if (selected === null || sending) return;
		const subscriptionId = selected.subscriptionId;
		setSending(true);
		try {
			const response = await fetch(
				`/api/reminders/subscriptions/${encodeURIComponent(subscriptionId)}/deliveries`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(input),
					credentials: 'same-origin',
					cache: 'no-store',
				},
			);
			if (!response.ok) throw new Error(await readError(response));
			if (!queuedReminderSchema.safeParse(await response.json()).success) {
				throw new Error('The reminder response could not be verified. Refresh before retrying.');
			}
			setUpcoming((current) =>
				current.map((item) =>
					item.subscriptionId === subscriptionId
						? { ...item, canSend: false, manualStatus: 'QUEUED' }
						: item,
				),
			);
			setSelected(null);
			setNotice({
				id: Date.now(),
				tone: 'success',
				message: 'Email reminder queued for delivery.',
			});
		} catch (error: unknown) {
			setNotice({
				id: Date.now(),
				tone: 'error',
				message: error instanceof Error ? error.message : 'Could not submit the email.',
			});
		} finally {
			setSending(false);
		}
	}

	return (
		<div className={styles.page}>
			<PageHeader
				title="Reminders"
				description="Review memberships expiring in the next 14 days."
				actions={
					upcomingErrorStatus === null && upcoming.length > 0 ? (
						<Button icon={RefreshIcon} variant="secondary" pending={refreshing} onClick={refresh}>
							Refresh
						</Button>
					) : undefined
				}
			/>
			<section className={styles.workspace} aria-label="Expiring memberships">
				{upcomingErrorStatus !== null ? (
					<EmptyState
						icon={Mail01Icon}
						role="alert"
						title={
							upcomingErrorStatus === 401
								? 'Your session has expired'
								: 'Expiring memberships unavailable'
						}
						description={
							upcomingErrorStatus === 401
								? 'Sign in again to view upcoming expiries.'
								: 'We could not load upcoming expiries. Please try again.'
						}
						action={
							upcomingErrorStatus === 401 ? (
								<ButtonLink href={routes.login} icon={ArrowRight01Icon}>
									Open sign in
								</ButtonLink>
							) : (
								<Button icon={RefreshIcon} pending={refreshing} onClick={refresh}>
									Refresh
								</Button>
							)
						}
					/>
				) : (
					<>
						{upcoming.length > 0 || search !== '' ? (
							<RemindersToolbar
								count={visible.length}
								total={upcoming.length}
								term={search}
								status={status}
								order={order}
								onTermChange={changeSearch}
								onFiltersApply={(nextStatus, nextOrder) => {
									setStatus(nextStatus);
									setOrder(nextOrder);
									setCurrentPage(1);
								}}
							/>
						) : null}
						{loadingMore && upcoming.length === 0 ? (
							<EmptyState
								icon={Mail01Icon}
								title="Loading reminders"
								description="Searching matching memberships…"
							/>
						) : loadError ? (
							<EmptyState
								icon={Mail01Icon}
								role="alert"
								title="Expiring memberships unavailable"
								description="We could not load the latest reminder results. Please try again."
								action={
									<Button
										icon={RefreshIcon}
										onClick={() => void loadUpcoming(appliedSearch.current)}
									>
										Retry
									</Button>
								}
							/>
						) : visible.length === 0 ? (
							<EmptyState
								icon={Mail01Icon}
								title={
									search === '' && status === 'ALL'
										? 'No memberships nearing expiry'
										: 'No matching members'
								}
								description={
									search === '' && status === 'ALL'
										? 'Memberships ending within the next 14 days will appear here.'
										: 'Try another search or filter.'
								}
								action={
									search === '' && status === 'ALL' ? (
										<Button icon={RefreshIcon} pending={refreshing} onClick={refresh}>
											Refresh reminders
										</Button>
									) : (
										<Button
											icon={Cancel01Icon}
											variant="secondary"
											onClick={() => {
												if (searchTimer.current !== null) clearTimeout(searchTimer.current);
												const hadSearch = appliedSearch.current !== '';
												appliedSearch.current = '';
												setSearch('');
												setStatus('ALL');
												setOrder('SOONEST');
												if (hadSearch) void loadUpcoming('');
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
										Memberships ending in the next 14 days
									</caption>
									<thead>
										<tr>
											<th scope="col">Member</th>
											<th scope="col">Membership</th>
											<th scope="col">Expires</th>
											<th scope="col">Time left</th>
											<th scope="col">Reminder</th>
											<th scope="col">Action</th>
										</tr>
									</thead>
									<tbody>
										{pageItems.map((item) => (
											<tr key={item.subscriptionId}>
												<td>
													<strong>{item.memberName}</strong>
												</td>
												<td>{item.planName}</td>
												<td>
													<time dateTime={item.endDate}>{formattedDate(item.endDate)}</time>
												</td>
												<td>
													{item.daysRemaining === 0
														? 'Today'
														: `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'}`}
												</td>
												<td>
													<span className={styles.status} data-status={item.manualStatus ?? 'NONE'}>
														{item.manualStatus === null
															? item.canSend
																? 'Ready'
																: 'Email unavailable'
															: item.manualStatus === 'QUEUED' || item.manualStatus === 'PROCESSING'
																? 'Queued'
																: item.manualStatus === 'ACCEPTED'
																	? 'Provider accepted'
																	: item.manualStatus === 'DELIVERED'
																		? 'Delivered'
																		: 'Needs review'}
													</span>
												</td>
												<td>
													{item.canSend ? (
														<Button
															icon={Mail01Icon}
															width="small"
															onClick={() => setSelected(item)}
														>
															Send reminder
														</Button>
													) : (
														<span className={styles.muted}>—</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
						<Pagination
							label="Reminders"
							page={displayedPage}
							loadedPages={loadedPages}
							hasNext={nextCursor !== null}
							pending={loadingMore}
							onPageChange={changePage}
						/>
					</>
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
