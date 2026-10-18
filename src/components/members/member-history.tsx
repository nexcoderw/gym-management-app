'use client';

import { ArrowDown01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { routes } from '@/constants/routes';
import { memberSubscriptionListSchema, type MemberSubscriptionList } from '@/lib/contracts';
import { memberRequest } from './member-requests';
import styles from './member-form.module.css';

export function MemberHistory({ memberId }: { readonly memberId: string }) {
	const [page, setPage] = useState<MemberSubscriptionList | null>(null);
	const [pending, setPending] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const controller = useRef<AbortController | null>(null);

	const load = useCallback(
		async (cursor: string | null, signal: AbortSignal) => {
			try {
				const suffix = cursor === null ? '' : `?cursor=${encodeURIComponent(cursor)}`;
				const result = await memberRequest(
					`${routes.memberSubscriptionsApi(memberId)}${suffix}`,
					memberSubscriptionListSchema,
					{ signal },
				);
				if (signal.aborted) return;
				setPage((current) => {
					const known = new Set(current?.items.map((item) => item.id));
					return {
						...result,
						items:
							cursor === null
								? result.items
								: [
										...(current?.items ?? []),
										...result.items.filter((item) => !known.has(item.id)),
									],
					};
				});
			} catch (failure: unknown) {
				if (!signal.aborted)
					setError(
						failure instanceof Error ? failure.message : 'Plan history could not be loaded.',
					);
			} finally {
				if (!signal.aborted) setPending(false);
			}
		},
		[memberId],
	);

	useEffect(() => {
		const request = new AbortController();
		controller.current = request;
		void load(null, request.signal);
		return () => {
			request.abort();
			controller.current?.abort();
		};
	}, [load]);

	function more() {
		setPending(true);
		setError(null);
		controller.current?.abort();
		const request = new AbortController();
		controller.current = request;
		void load(page?.nextCursor ?? null, request.signal);
	}

	return (
		<section className={styles.history} aria-label="Plan registration history" aria-busy={pending}>
			<h3>Plan history</h3>
			{page?.items.map((item) => (
				<article key={item.id} className={styles.registration}>
					<h3>{item.planName}</h3>
					<p>
						{item.status.toLowerCase()} — {item.startDate} to {item.endDate} (inclusive)
					</p>
					<p>
						{item.periodCount} {item.periodUnit.toLowerCase()} ·{' '}
						{new Intl.NumberFormat('en-RW').format(item.price)} {item.currency}
					</p>
				</article>
			))}
			{page?.items.length === 0 ? (
				<p className={styles.hint}>No plan registrations recorded.</p>
			) : null}
			{pending ? <p role="status">Loading plan history…</p> : null}
			{error ? (
				<p role="alert" className={styles.error}>
					{error}
				</p>
			) : null}
			{error || page?.nextCursor ? (
				<Button
					icon={error ? RefreshIcon : ArrowDown01Icon}
					variant="secondary"
					pending={pending}
					onClick={more}
				>
					{error ? 'Retry history' : 'Load more history'}
				</Button>
			) : null}
		</section>
	);
}
