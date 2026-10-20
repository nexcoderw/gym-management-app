'use client';

import {
	Add01Icon,
	ArrowDown01Icon,
	Cancel01Icon,
	RefreshIcon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button, ButtonLink } from '@/components/shared/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
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
	term: string,
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
	if (term.trim()) query.set('search', term.trim());
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
		void loadMembers(view.status, false, order, term, fromDate, toDate);
	}

	const activeController = useRef<AbortController | null>(null);
	const requestNumber = useRef(0);
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			requestNumber.current += 1;
			activeController.current?.abort();
			if (searchTimer.current !== null) clearTimeout(searchTimer.current);
		};
	}, []);

	function changeTerm(value: string) {
		setTerm(value);
		if (searchTimer.current !== null) clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => {
			void loadMembers(view.status, false, order, value, fromDate, toDate);
		}, 300);
	}

	async function loadMembers(
		status: MemberStatus,
		append = false,
		selectedOrder = order,
		search = term,
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
			const result = await readMembers(
				status,
				selectedOrder,
				search,
				from,
				to,
				cursor,
				controller.signal,
			);

			if (currentRequest !== requestNumber.current) return;

			setView((current) => {
				const knownIds = new Set(current.items.map((member) => member.id));

				return {
					status,
					items: append
						? [...current.items, ...result.items.filter((member) => !knownIds.has(member.id))]
						: result.items,
					nextCursor: result.nextCursor,
					errorStatus: null,
					loading: 'idle',
				};
			});
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

	const visibleMembers = view.items;

	const busy = view.loading !== 'idle';
	const failure = view.errorStatus === null ? null : errorDetails(view.errorStatus);
	const canLoadMore = view.nextCursor !== null;
	const searching = term.trim() !== '';
	const filtered = searching || fromDate !== '' || toDate !== '';

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
					onTermChange={changeTerm}
					onStatusChange={(status) => {
					if (searchTimer.current !== null) clearTimeout(searchTimer.current);
					void loadMembers(status);
				}}
					onOrderChange={(value) => {
					if (searchTimer.current !== null) clearTimeout(searchTimer.current);
					setOrder(value);
					void loadMembers(view.status, false, value);
				}}
					onFromDateChange={(value) => {
					if (searchTimer.current !== null) clearTimeout(searchTimer.current);
					setFromDate(value);
					void loadMembers(view.status, false, order, term, value);
				}}
					onToDateChange={(value) => {
					if (searchTimer.current !== null) clearTimeout(searchTimer.current);
					setToDate(value);
					void loadMembers(view.status, false, order, term, fromDate, value);
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

				{view.loading !== 'page' && failure === null && view.items.length === 0 ? (
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
								? 'Try another search or date range.'
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
										if (searchTimer.current !== null) clearTimeout(searchTimer.current);
										setTerm('');
										setFromDate('');
										setToDate('');
										void loadMembers(view.status, false, order, '', '', '');
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
						{visibleMembers.map((member) => (
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

				{canLoadMore && view.loading !== 'page' && failure === null ? (
					<div className={styles.more}>
						<Button
							icon={ArrowDown01Icon}
							variant="secondary"
							pending={view.loading === 'more'}
							disabled={busy}
							onClick={() => void loadMembers(view.status, true)}
						>
							Load more
						</Button>
					</div>
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
