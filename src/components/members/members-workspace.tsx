'use client';

import {
	Add01Icon,
	Cancel01Icon,
	RefreshIcon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button, ButtonLink } from '@/components/shared/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { Toast, type ToastNotice } from '@/components/shared/toast';
import { routes } from '@/constants/routes';
import { memberListSchema, type Member, type MemberList, type MemberStatus } from '@/lib/contracts';

import { MemberCard } from './member-card';
import { MemberDialogs, type MemberDialogState } from './member-dialogs';
import { MembersToolbar, type MemberOrder } from './members-toolbar';
import styles from './members-workspace.module.css';

type LoadingState = 'idle' | 'page' | 'more';

interface MembersView {
	readonly status: MemberStatus;
	readonly items: Member[];
	readonly nextCursor: string | null;
	readonly errorStatus: number | null;
	readonly loading: LoadingState;
}

class MembersRequestError extends Error {
	constructor(readonly status: number) {
		super('The members request failed.');
	}
}

async function readMembers(
	status: MemberStatus,
	order: MemberOrder,
	fromDate: string,
	toDate: string,
	cursor: string | null,
	signal: AbortSignal,
): Promise<MemberList> {
	const query = new URLSearchParams({
		status,
		limit: '24',
		order: order.replace('-', '_').toUpperCase(),
	});
	if (fromDate) query.set('fromDate', fromDate);
	if (toDate) query.set('toDate', toDate);

	if (cursor !== null) {
		query.set('cursor', cursor);
	}

	const response = await fetch(`${routes.membersApi}?${query.toString()}`, {
		method: 'GET',
		cache: 'no-store',
		signal,
	});

	if (!response.ok) {
		throw new MembersRequestError(response.status);
	}

	const body: unknown = await response.json();
	return memberListSchema.parse(body);
}

function errorDetails(status: number) {
	switch (status) {
		case 401:
			return {
				title: 'Session expired',
				message: 'Please sign in again to access gym members.',
			};
		case 403:
			return {
				title: 'Access denied',
				message: 'An active gym owner account is required to view members.',
			};
		case 429:
			return {
				title: 'Too many requests',
				message: 'Please wait a moment before trying again.',
			};
		default:
			return {
				title: 'Members unavailable',
				message: 'The latest member profiles could not be loaded. Please try again.',
			};
	}
}

export function MembersWorkspace({
	initialItems,
	initialNextCursor,
	initialErrorStatus = null,
}: {
	readonly initialItems: Member[];
	readonly initialNextCursor: string | null;
	readonly initialErrorStatus?: number | null;
}) {
	const [view, setView] = useState<MembersView>({
		status: 'ACTIVE',
		items: initialItems,
		nextCursor: initialNextCursor,
		errorStatus: initialErrorStatus,
		loading: 'idle',
	});

	const [term, setTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [order, setOrder] = useState<MemberOrder>('newest');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [dialog, setDialog] = useState<MemberDialogState | null>(null);
	const [notice, setNotice] = useState<ToastNotice | null>(null);
	const noticeId = useRef(0);

	function notify(message: string, tone: ToastNotice['tone']) {
		setNotice({ id: ++noticeId.current, message, tone });
	}

	function saved() {
		setDialog(null);
		void loadMembers(view.status, false, order, fromDate, toDate);
	}

	const activeController = useRef<AbortController | null>(null);
	const requestNumber = useRef(0);

	useEffect(() => {
		return () => {
			requestNumber.current += 1;
			activeController.current?.abort();
		};
	}, []);

	async function loadMembers(
		status: MemberStatus,
		append = false,
		selectedOrder = order,
		from = fromDate,
		to = toDate,
	) {
		if (append && (view.nextCursor === null || view.loading !== 'idle')) {
			return;
		}

		const cursor = append ? view.nextCursor : null;
		const currentRequest = ++requestNumber.current;

		activeController.current?.abort();

		const controller = new AbortController();
		activeController.current = controller;

		setView((current) => ({
			status,
			items: append ? current.items : [],
			nextCursor: append ? current.nextCursor : null,
			errorStatus: null,
			loading: append ? 'more' : 'page',
		}));

		try {
			const result = await readMembers(status, selectedOrder, from, to, cursor, controller.signal);

			if (currentRequest !== requestNumber.current) return;

			const knownIds = new Set(view.items.map((member) => member.id));
			const nextItems = append
				? [...view.items, ...result.items.filter((member) => !knownIds.has(member.id))]
				: result.items;
			setView({
				status,
				items: nextItems,
				nextCursor: result.nextCursor,
				errorStatus: null,
				loading: 'idle',
			});
			setCurrentPage(
				append
					? Math.max(1, Math.ceil(nextItems.filter((member) =>
							!term.trim() || [member.name, member.phoneNumber, member.email ?? ''].some((value) => value.toLocaleLowerCase('en').includes(term.trim().toLocaleLowerCase('en'))),
						).length / 24))
					: 1,
			);
		} catch (error: unknown) {
			if (controller.signal.aborted || currentRequest !== requestNumber.current) {
				return;
			}

			const errorStatus = error instanceof MembersRequestError ? error.status : 503;

			const accessLost = errorStatus === 401 || errorStatus === 403;

			setView((current) => ({
				...current,
				items: accessLost ? [] : current.items,
				nextCursor: accessLost ? null : current.nextCursor,
				errorStatus,
				loading: 'idle',
			}));
		} finally {
			if (currentRequest === requestNumber.current) {
				activeController.current = null;
			}
		}
	}

	const needle = term.trim().toLocaleLowerCase('en');
	const visibleMembers = view.items.filter(
		(member) =>
			!needle ||
			[member.name, member.phoneNumber, member.email ?? ''].some((value) =>
				value.toLocaleLowerCase('en').includes(needle),
			),
	);
	const loadedPages = Math.max(1, Math.ceil(visibleMembers.length / 24));
	const displayedPage = Math.min(currentPage, loadedPages);
	const pageMembers = visibleMembers.slice((displayedPage - 1) * 24, displayedPage * 24);

	const busy = view.loading !== 'idle';
	const failure = view.errorStatus === null ? null : errorDetails(view.errorStatus);
	const canLoadMore = view.nextCursor !== null;
	const searching = term.trim() !== '';
	const filtered = searching || fromDate !== '' || toDate !== '';

	function changePage(page: number) {
		if (page <= loadedPages) {
			setCurrentPage(page);
		} else if (page === loadedPages + 1 && canLoadMore) {
			void loadMembers(view.status, true);
		}
	}

	return (
		<div className={styles.page}>
			<PageHeader
				title="Members"
				description="Review registered members, contact details and profile status."
			/>

			<section className={styles.registry} aria-label="Member registry" aria-busy={busy}>
				<MembersToolbar
					visibleCount={visibleMembers.length}
					loadedCount={view.items.length}
					hasMore={canLoadMore}
					status={view.status}
					order={order}
					term={term}
					fromDate={fromDate}
					toDate={toDate}
					pending={busy}
					error={failure !== null}
					onTermChange={(value) => {
						setTerm(value);
						setCurrentPage(1);
					}}
					onFiltersApply={(status, selectedOrder, from, to) => {
						setOrder(selectedOrder);
						setFromDate(from);
						setToDate(to);
						void loadMembers(status, false, selectedOrder, from, to);
					}}
				/>

				{failure !== null ? (
					<div className={styles.message} role="alert">
						<h2>{failure.title}</h2>
						<p>{failure.message}</p>

						{view.errorStatus === 401 ? (
							<Link className={styles.signIn} href={routes.login}>
								Sign in again
							</Link>
						) : view.errorStatus !== 403 ? (
							<Button
								icon={RefreshIcon}
								variant="secondary"
								pending={busy}
								onClick={() => void loadMembers(view.status)}
							>
								Try again
							</Button>
						) : null}
					</div>
				) : null}

				{view.loading === 'page' ? (
					<div className={styles.message} role="status">
						<p>Loading member profiles…</p>
					</div>
				) : null}

				{view.loading !== 'page' && failure === null && visibleMembers.length === 0 ? (
					<EmptyState
						icon={UserGroupIcon}
						title={
							filtered
								? 'No matching members'
								: view.status === 'ACTIVE'
									? 'Register your first member'
									: 'No archived members found'
						}
						description={
							filtered
								? searching && canLoadMore
									? 'No loaded profiles match. Open the next page or try another search.'
									: 'Try another search or date range.'
								: view.status === 'ACTIVE'
									? 'Add their contact details and choose the membership plan they are joining.'
									: 'Archived member profiles will appear here.'
						}
						action={
							filtered ? (
								<Button
									icon={Cancel01Icon}
									variant="secondary"
									onClick={() => {
										setTerm('');
										setFromDate('');
										setToDate('');
										if (fromDate || toDate) void loadMembers(view.status, false, order, '', '');
									}}
								>
									Clear filters
								</Button>
							) : view.status === 'ACTIVE' ? (
								<ButtonLink href={routes.payments} icon={Add01Icon} variant="primary">
									Add member
								</ButtonLink>
							) : undefined
						}
					/>
				) : null}

				{visibleMembers.length > 0 ? (
					<ul className={styles.grid} role="list">
						{pageMembers.map((member) => (
							<li key={member.id} className={styles.item}>
								<MemberCard
									member={member}
									onOpen={(member) => setDialog({ kind: 'details', member })}
									onEdit={(member) => setDialog({ kind: 'edit', member })}
									onArchive={(member) => setDialog({ kind: 'archive', member })}
								/>
							</li>
						))}
					</ul>
				) : null}

				{view.loading !== 'page' && failure === null ? (
					<Pagination
						label="Members"
						page={displayedPage}
						loadedPages={loadedPages}
						hasNext={canLoadMore}
						pending={busy}
						onPageChange={changePage}
					/>
				) : null}
			</section>

			{dialog !== null ? (
				<MemberDialogs
					key={dialog.kind === 'create' ? 'create' : `${dialog.kind}-${dialog.member.id}`}
					selection={dialog}
					onClose={() => setDialog(null)}
					onSaved={saved}
					notify={notify}
				/>
			) : null}
			{notice !== null ? <Toast notice={notice} onDismiss={() => setNotice(null)} /> : null}
		</div>
	);
}
