'use client';

import { ArrowDown01Icon, RefreshIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/shared/button';
import { PageHeader } from '@/components/shared/page-header';
import { routes } from '@/constants/routes';
import {
	memberListSchema,
	memberStatusSchema,
	type Member,
	type MemberList,
	type MemberStatus,
} from '@/lib/contracts';

import { MemberCard } from './member-card';
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
			if (controller.signal.aborted || currentRequest !== requestNumber.current) return;

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

	const busy = view.loading !== 'idle';
	const failure = view.errorStatus === null ? null : errorDetails(view.errorStatus);
	const canLoadMore = view.nextCursor !== null;

	return (
		<div className={styles.page}>
			<PageHeader
				title="Members"
				description="View and manage member profiles registered to your gym."
				actions={
					<Button
						icon={RefreshIcon}
						variant="secondary"
						pending={view.loading === 'page'}
						disabled={busy}
						onClick={() => void loadMembers(view.status)}
					>
						Refresh
					</Button>
				}
			/>

			<section className={styles.workspace} aria-label="Member profiles">
				<div className={styles.toolbar}>
					<div className={styles.filter}>
						<label htmlFor="member-profile-status">Profile status</label>
						<select
							id="member-profile-status"
							value={view.status}
							onChange={(event) => {
								const parsed = memberStatusSchema.safeParse(event.target.value);
								if (parsed.success && parsed.data !== view.status) {
									void loadMembers(parsed.data);
								}
							}}
						>
							<option value="ACTIVE">Active profiles</option>
							<option value="ARCHIVED">Archived profiles</option>
						</select>
					</div>

					<p className={styles.count} role="status">
						{view.loading === 'page'
							? 'Loading profiles…'
							: view.errorStatus !== null && view.items.length === 0
								? 'Profile count unavailable'
								: `${view.items.length} loaded ${view.status.toLowerCase()} profile${view.items.length === 1 ? '' : 's'}`}
					</p>
				</div>

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

				{view.loading !== 'page' && view.errorStatus === null && view.items.length === 0 ? (
					<div className={styles.empty}>
						<span className={styles.emptyIcon} aria-hidden="true">
							<HugeiconsIcon icon={UserGroupIcon} size={28} strokeWidth={1.7} />
						</span>
						<h2>{view.status === 'ACTIVE' ? 'No active members yet' : 'No archived members'}</h2>
						<p>
							{view.status === 'ACTIVE'
								? 'Registered member profiles will appear here.'
								: 'Archived member profiles will appear here.'}
						</p>
					</div>
				) : null}

				{view.items.length > 0 ? (
					<div className={styles.list}>
						{view.items.map((member) => (
							<MemberCard key={member.id} member={member} />
						))}
					</div>
				) : null}

				{canLoadMore && view.errorStatus === null ? (
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
		</div>
	);
}
