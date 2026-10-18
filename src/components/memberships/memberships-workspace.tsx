'use client';

import {
	Add01Icon,
	ArrowDown01Icon,
	Cancel01Icon,
	PackageAdd01Icon,
	RefreshIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
	ArchiveMembershipDialog,
	MembershipDetailsDialog,
	MembershipEditorDialog,
} from '@/components/memberships/membership-dialogs';
import { Button } from '@/components/shared/button';
import { PageHeader } from '@/components/shared/page-header';
import { Toast, type ToastNotice } from '@/components/shared/toast';
import { routes } from '@/constants/routes';
import {
	membershipPlanListSchema,
	membershipPlanSchema,
	type MembershipPlan,
	type MembershipPlanInput,
} from '@/lib/contracts';
import {
	MembershipToolbar,
	type MembershipFilter,
	type MembershipOrder,
} from './membership-toolbar';
import { MembershipCard } from './membership-card';
import styles from './memberships-workspace.module.css';

type DialogState =
	| { readonly kind: 'create' }
	| { readonly kind: 'details' | 'edit' | 'archive'; readonly plan: MembershipPlan }
	| null;

export function MembershipsWorkspace({
	initialItems,
	initialNextCursor,
	initialError,
}: {
	readonly initialItems: MembershipPlan[];
	readonly initialNextCursor: string | null;
	readonly initialError?: string;
}) {
	const [plans, setPlans] = useState(initialItems);
	const [nextCursor, setNextCursor] = useState(initialNextCursor);
	const [filter, setFilter] = useState<MembershipFilter>('ACTIVE');
	const [term, setTerm] = useState('');
	const [order, setOrder] = useState<MembershipOrder>('price-asc');
	const [dialog, setDialog] = useState<DialogState>(null);
	const [pending, setPending] = useState(false);
	const [loadingAction, setLoadingAction] = useState('');
	const [loadFailed, setLoadFailed] = useState(initialError !== undefined);
	const noticeIdRef = useRef(initialError === undefined ? 0 : 1);
	const [notice, setNotice] = useState<ToastNotice | null>(
		initialError === undefined ? null : { id: 1, message: initialError, tone: 'error' },
	);

	const visiblePlans = useMemo(() => {
		const query = term.trim().toLocaleLowerCase('en-US');
		return plans
			.filter(
				(plan) => plan.status === filter && plan.name.toLocaleLowerCase('en-US').includes(query),
			)
			.sort((left, right) => {
				const nameOrder = left.name.localeCompare(right.name, 'en', { numeric: true });
				switch (order) {
					case 'price-asc':
						return left.price - right.price || nameOrder;
					case 'price-desc':
						return right.price - left.price || nameOrder;
					case 'name-asc':
						return nameOrder;
					case 'newest':
						return right.createdAt.localeCompare(left.createdAt) || nameOrder;
				}
			});
	}, [filter, plans, term, order]);
	const dismissToast = useCallback(() => setNotice(null), []);
	const showToolbar = plans.length >= 2 || plans.some((plan) => plan.status === 'ARCHIVED');
	const emptyAction =
		filter === 'ARCHIVED'
			? { label: 'Show active', icon: RefreshIcon, primary: false }
			: term.trim() !== ''
				? { label: 'Clear search', icon: Cancel01Icon, primary: false }
				: { label: 'Add membership', icon: Add01Icon, primary: true };

	function notify(message: string, tone: ToastNotice['tone']) {
		noticeIdRef.current += 1;
		setNotice({ id: noticeIdRef.current, message, tone });
	}

	async function openPlan(kind: 'details' | 'edit' | 'archive', plan: MembershipPlan) {
		if (loadingAction !== '') return;
		setLoadingAction(`${kind}:${plan.id}`);
		try {
			const latest = await requestMembershipPlan(routes.membershipPlanApi(plan.id));
			if (kind !== 'details' && latest.status === 'ARCHIVED') {
				throw new Error('This membership has already been archived.');
			}
			setPlans((current) => current.map((item) => (item.id === latest.id ? latest : item)));
			setDialog({ kind, plan: latest });
		} catch (error: unknown) {
			notify(errorMessage(error), 'error');
		} finally {
			setLoadingAction('');
		}
	}

	async function create(input: MembershipPlanInput) {
		setPending(true);
		try {
			const created = await requestMembershipPlan(routes.membershipPlansApi, {
				method: 'POST',
				body: JSON.stringify(input),
			});
			setPlans((current) => [created, ...current.filter((plan) => plan.id !== created.id)]);
			setLoadFailed(false);
			setFilter('ACTIVE');
			setDialog(null);
			notify(`${created.name} was created.`, 'success');
		} catch (error: unknown) {
			notify(errorMessage(error), 'error');
		} finally {
			setPending(false);
		}
	}

	async function reload() {
		if (loadingAction !== '') return;
		setLoadingAction('refresh');
		try {
			const response = await fetch(`${routes.membershipPlansApi}?status=ALL&limit=50`, {
				cache: 'no-store',
			});
			const page = membershipPlanListSchema.parse(await readJsonResponse(response));
			setPlans(page.items);
			setNextCursor(page.nextCursor);
			setFilter('ACTIVE');
			setTerm('');
			setLoadFailed(false);
			notify('Memberships refreshed.', 'success');
		} catch (error: unknown) {
			setLoadFailed(true);
			notify(errorMessage(error), 'error');
		} finally {
			setLoadingAction('');
		}
	}

	async function update(input: MembershipPlanInput) {
		if (dialog?.kind !== 'edit') return;
		setPending(true);
		try {
			const updated = await requestMembershipPlan(routes.membershipPlanApi(dialog.plan.id), {
				method: 'PATCH',
				body: JSON.stringify({ ...input, updatedAt: dialog.plan.updatedAt }),
			});
			setPlans((current) => current.map((plan) => (plan.id === updated.id ? updated : plan)));
			setDialog(null);
			notify(`${updated.name} was updated.`, 'success');
		} catch (error: unknown) {
			notify(errorMessage(error), 'error');
		} finally {
			setPending(false);
		}
	}

	async function archive() {
		if (dialog?.kind !== 'archive') return;
		setPending(true);
		try {
			await requestEmpty(routes.membershipPlanApi(dialog.plan.id), {
				method: 'DELETE',
				body: JSON.stringify({ updatedAt: dialog.plan.updatedAt }),
			});
			const archivedAt = new Date().toISOString();
			setPlans((current) =>
				current.map((plan) =>
					plan.id === dialog.plan.id
						? { ...plan, status: 'ARCHIVED', archivedAt, updatedAt: archivedAt }
						: plan,
				),
			);
			setDialog(null);
			notify(`${dialog.plan.name} was archived.`, 'success');
		} catch (error: unknown) {
			notify(errorMessage(error), 'error');
		} finally {
			setPending(false);
		}
	}

	async function loadMore() {
		if (nextCursor === null || loadingAction !== '') return;
		setLoadingAction('load-more');
		try {
			const response = await fetch(
				`${routes.membershipPlansApi}?status=ALL&limit=50&cursor=${encodeURIComponent(nextCursor)}`,
				{ cache: 'no-store' },
			);
			const page = membershipPlanListSchema.parse(await readJsonResponse(response));
			setPlans((current) => {
				const known = new Set(current.map((plan) => plan.id));
				return [...current, ...page.items.filter((plan) => !known.has(plan.id))];
			});
			setNextCursor(page.nextCursor);
		} catch (error: unknown) {
			notify(errorMessage(error), 'error');
		} finally {
			setLoadingAction('');
		}
	}

	return (
		<div className={styles.page}>
			<PageHeader
				title="Memberships"
				description="Create clear offers with a name, whole-RWF price and optional included activities."
				actions={
					plans.length > 0 ? (
						<Button icon={Add01Icon} width="medium" onClick={() => setDialog({ kind: 'create' })}>
							Add membership
						</Button>
					) : undefined
				}
			/>

			<section
				className={styles.workspace}
				aria-label="Membership plans"
				data-empty={plans.length === 0 ? 'true' : undefined}
			>
				{showToolbar ? (
					<MembershipToolbar
						count={visiblePlans.length}
						total={plans.length}
						hasMore={nextCursor !== null}
						term={term}
						status={filter}
						order={order}
						onTermChange={setTerm}
						onStatusChange={setFilter}
						onOrderChange={setOrder}
					/>
				) : null}

				{visiblePlans.length === 0 ? (
					<div className={styles.empty}>
						<span className={styles.emptyIcon}>
							<HugeiconsIcon
								icon={PackageAdd01Icon}
								size={28}
								strokeWidth={1.7}
								aria-hidden="true"
							/>
						</span>
						<h3>
							{loadFailed
								? 'Memberships unavailable'
								: plans.length === 0
									? 'Create your first membership'
									: filter === 'ARCHIVED'
										? 'No archived memberships found'
										: 'No active memberships found'}
						</h3>
						<p>
							{loadFailed
								? 'The latest memberships could not be loaded. Refresh to try again.'
								: plans.length === 0
									? 'Start with a simple name and price. Activities can be added now or later.'
									: 'Try a different name or clear the filters to see your plans.'}
						</p>
						{plans.length === 0 ? (
							<Button
								icon={loadFailed ? RefreshIcon : Add01Icon}
								width="medium"
								pending={loadingAction === 'refresh'}
								onClick={loadFailed ? reload : () => setDialog({ kind: 'create' })}
							>
								{loadFailed ? 'Refresh' : 'Add membership'}
							</Button>
						) : (
							<Button
								icon={emptyAction.icon}
								variant={emptyAction.primary ? 'primary' : 'secondary'}
								width={emptyAction.primary ? 'medium' : 'small'}
								onClick={() => {
									if (emptyAction.primary) {
										setDialog({ kind: 'create' });
									} else {
										setFilter('ACTIVE');
										setTerm('');
									}
								}}
							>
								{emptyAction.label}
							</Button>
						)}
					</div>
				) : (
					<div className={styles.list}>
						{visiblePlans.map((plan) => (
							<MembershipCard
								key={plan.id}
								plan={plan}
								pendingAction={
									loadingAction === `details:${plan.id}`
										? 'details'
										: loadingAction === `edit:${plan.id}`
											? 'edit'
											: loadingAction === `archive:${plan.id}`
												? 'archive'
												: undefined
								}
								disabled={loadingAction !== ''}
								onAction={openPlan}
							/>
						))}
					</div>
				)}
				{nextCursor !== null ? (
					<div className={styles.more}>
						<Button
							variant="secondary"
							width="medium"
							icon={ArrowDown01Icon}
							pending={loadingAction === 'load-more'}
							onClick={loadMore}
						>
							Load more
						</Button>
					</div>
				) : null}
			</section>

			{dialog?.kind === 'create' ? (
				<MembershipEditorDialog
					open
					onClose={() => setDialog(null)}
					onSubmit={create}
					pending={pending}
				/>
			) : null}
			{dialog?.kind === 'edit' ? (
				<MembershipEditorDialog
					open
					plan={dialog.plan}
					onClose={() => setDialog(null)}
					onSubmit={update}
					pending={pending}
				/>
			) : null}
			{dialog?.kind === 'details' ? (
				<MembershipDetailsDialog open plan={dialog.plan} onClose={() => setDialog(null)} />
			) : null}
			{dialog?.kind === 'archive' ? (
				<ArchiveMembershipDialog
					open
					plan={dialog.plan}
					onClose={() => setDialog(null)}
					onArchive={archive}
					pending={pending}
				/>
			) : null}
			{notice ? <Toast key={notice.id} notice={notice} onDismiss={dismissToast} /> : null}
		</div>
	);
}

async function requestMembershipPlan(url: string, init?: RequestInit): Promise<MembershipPlan> {
	const response = await fetch(url, {
		...init,
		headers: { 'Content-Type': 'application/json' },
		cache: 'no-store',
	});
	return membershipPlanSchema.parse(await readJsonResponse(response));
}

async function requestEmpty(url: string, init: RequestInit): Promise<void> {
	const response = await fetch(url, {
		...init,
		headers: { 'Content-Type': 'application/json' },
		cache: 'no-store',
	});
	if (!response.ok) await readJsonResponse(response);
}

async function readJsonResponse(response: Response): Promise<unknown> {
	const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
	if (!response.ok) {
		throw new Error(
			typeof body?.message === 'string' ? body.message : 'The request could not be completed.',
		);
	}
	return body;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'The request could not be completed.';
}
