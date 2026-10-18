'use client';

import {
	ArrowDown01Icon,
	Cancel01Icon,
	RefreshIcon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/shared/button';
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
	cursor: string | null,
	signal: AbortSignal,
): Promise<MemberList> {
	const query = new URLSearchParams({
		status,
		limit: '20',
	});

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
	const [dialog, setDialog] = useState<MemberDialogState | null>(null);
	const [notice, setNotice] = useState<ToastNotice | null>(null);
	const noticeId = useRef(0);

	function notify(message: string, tone: ToastNotice['tone']) {
		setNotice({ id: ++noticeId.current, message, tone });
	}

	function saved() {
		setDialog(null);
		void loadMembers(view.status);
	}

	const activeController = useRef<AbortController | null>(null);
	const requestNumber = useRef(0);

	useEffect(() => {
		return () => {
			requestNumber.current += 1;
			activeController.current?.abort();
		};
	}, []);

	async function loadMembers(status: MemberStatus, append = false) {
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
			const result = await readMembers(status, cursor, controller.signal);

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

	const visibleMembers = useMemo(() => {
		const needle = term.trim().toLocaleLowerCase('en');

		const filtered = view.items.filter((member) => {
			if (!needle) return true;

			return (
				member.name.toLocaleLowerCase('en').includes(needle) ||
				member.phoneNumber.toLocaleLowerCase('en').includes(needle) ||
				(member.email ?? '').toLocaleLowerCase('en').includes(needle)
			);
		});

		return filtered.sort((left, right) => {
			const nameOrder = left.name.localeCompare(right.name, 'en', {
				numeric: true,
			});

			switch (order) {
				case 'name-asc':
					return nameOrder || left.id.localeCompare(right.id);
				case 'name-desc':
					return -nameOrder || left.id.localeCompare(right.id);
				case 'oldest':
					return left.createdAt.localeCompare(right.createdAt) || nameOrder;
				case 'newest':
					return right.createdAt.localeCompare(left.createdAt) || nameOrder;
			}
		});
	}, [view.items, term, order]);

	const busy = view.loading !== 'idle';
	const failure = view.errorStatus === null ? null : errorDetails(view.errorStatus);
	const canLoadMore = view.nextCursor !== null;
	const searching = term.trim() !== '';

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
					pending={busy}
					error={failure !== null}
					onTermChange={setTerm}
					onStatusChange={(status) => void loadMembers(status)}
					onOrderChange={setOrder}
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
								onClick={() => void loadMembers(view.status, view.items.length > 0 && canLoadMore)}
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
					<div className={styles.empty}>
						<span className={styles.emptyIcon} aria-hidden="true">
							<HugeiconsIcon icon={UserGroupIcon} size={28} strokeWidth={1.7} />
						</span>

						<h2>
							{view.status === 'ACTIVE'
								? 'Register your first member'
								: 'No archived members found'}
						</h2>

						<p>
							{view.status === 'ACTIVE'
								? 'Add their contact details and choose the membership plan they are joining.'
								: 'Archived member profiles will appear here.'}
						</p>
						{view.status === 'ACTIVE' ? (
							<Link className={styles.emptyAction} href={routes.payments} role="button">
								Add member
							</Link>
						) : null}
					</div>
				) : null}

				{view.loading !== 'page' &&
				failure === null &&
				view.items.length > 0 &&
				visibleMembers.length === 0 ? (
					<div className={styles.empty}>
						<span className={styles.emptyIcon} aria-hidden="true">
							<HugeiconsIcon icon={UserGroupIcon} size={28} strokeWidth={1.7} />
						</span>

						<h2>No matching members</h2>

						<p>
							No loaded profiles match “{term.trim()}”.
							{canLoadMore
								? ' Search only checks loaded members. You can load more profiles.'
								: ' Try another name, phone number or email.'}
						</p>

						{searching ? (
							<Button icon={Cancel01Icon} variant="secondary" onClick={() => setTerm('')}>
								Clear search
							</Button>
						) : null}
					</div>
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
