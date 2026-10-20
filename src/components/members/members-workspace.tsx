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
import {
	numberedMemberListSchema,
	type Member,
	type MemberStatus,
	type NumberedMemberList,
} from '@/lib/contracts';

import { MemberCard } from './member-card';
import { MemberDialogs, type MemberDialogState } from './member-dialogs';
import { MembersToolbar, type MemberOrder } from './members-toolbar';
import styles from './members-workspace.module.css';

type LoadingState = 'idle' | 'page';

interface MembersView {
	readonly status: MemberStatus;
	readonly items: Member[];
	readonly page: number;
	readonly totalPages: number;
	readonly totalItems: number;
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
	page: number,
	signal: AbortSignal,
): Promise<NumberedMemberList> {
	const query = new URLSearchParams({
		status,
		limit: '20',
		page: String(page),
		order: order.replace('-', '_').toUpperCase(),
	});
	if (fromDate) query.set('fromDate', fromDate);
	if (toDate) query.set('toDate', toDate);

	const response = await fetch(`${routes.membersApi}?${query.toString()}`, {
		method: 'GET',
		cache: 'no-store',
		signal,
	});

	if (!response.ok) {
		throw new MembersRequestError(response.status);
	}

	const body: unknown = await response.json();
	return numberedMemberListSchema.parse(body);
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
	initialTotalPages = initialNextCursor === null ? 1 : 2,
	initialTotalItems = initialItems.length,
	initialErrorStatus = null,
}: {
	readonly initialItems: Member[];
	readonly initialNextCursor: string | null;
	readonly initialTotalPages?: number;
	readonly initialTotalItems?: number;
	readonly initialErrorStatus?: number | null;
}) {
	const [view, setView] = useState<MembersView>({
		status: 'ACTIVE',
		items: initialItems,
		page: 1,
		totalPages: initialTotalPages,
		totalItems: initialTotalItems,
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
		void loadMembers(view.status, view.page, order, fromDate, toDate);
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
		page = 1,
		selectedOrder = order,
		from = fromDate,
		to = toDate,
	) {
		const currentRequest = ++requestNumber.current;

		activeController.current?.abort();

		const controller = new AbortController();
		activeController.current = controller;

		setView((current) => ({
			...current,
			status,
			items: [],
			errorStatus: null,
			loading: 'page',
		}));

		try {
			const result = await readMembers(status, selectedOrder, from, to, page, controller.signal);

			if (currentRequest !== requestNumber.current) return;

			setView({
				status,
				items: result.items,
				page: result.page,
				totalPages: result.totalPages,
				totalItems: result.totalItems,
				errorStatus: null,
				loading: 'idle',
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
				totalPages: accessLost ? 0 : current.totalPages,
				totalItems: accessLost ? 0 : current.totalItems,
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
	const busy = view.loading !== 'idle';
	const failure = view.errorStatus === null ? null : errorDetails(view.errorStatus);
	const canLoadMore = view.page < view.totalPages;
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
					totalCount={view.totalItems}
					hasMore={canLoadMore}
					status={view.status}
					order={order}
					term={term}
					fromDate={fromDate}
					toDate={toDate}
					pending={busy}
					error={failure !== null}
					onTermChange={setTerm}
					onFiltersApply={(status, selectedOrder, from, to) => {
						setOrder(selectedOrder);
						setFromDate(from);
						setToDate(to);
						void loadMembers(status, 1, selectedOrder, from, to);
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
									? 'No members on this page match. Open the next page or try another search.'
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
										if (fromDate || toDate) void loadMembers(view.status, 1, order, '', '');
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

				{view.loading !== 'page' && failure === null ? (
					<Pagination
						label="Members"
						page={view.page}
						totalPages={view.totalPages}
						totalItems={view.totalItems}
						pageSize={20}
						pending={busy}
						onPageChange={(page) => void loadMembers(view.status, page)}
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
