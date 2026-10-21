'use client';

import { ArrowDown01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { routes } from '@/constants/routes';
import { memberSubscriptionListSchema, type MemberSubscriptionList } from '@/lib/contracts';
import { memberRequest } from './member-requests';
import styles from './member-history.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
});
const amountFormatter = new Intl.NumberFormat('en-RW');

function formatDate(value: string) {
	return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function MemberHistory({ memberId }: { readonly memberId: string }) {
	const [page, setPage] = useState<MemberSubscriptionList | null>(null);
	const [pending, setPending] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const controller = useRef<AbortController | null>(null);

	useEffect(() => {
		const request = new AbortController();
		controller.current = request;
		void requestHistory(memberId, null, request.signal)
			.then((result) => {
				if (request.signal.aborted) return;
				setPage(result);
				setError(null);
			})
			.catch((failure: unknown) => {
				if (request.signal.aborted) return;
				setError(failure instanceof Error ? failure.message : 'Plan history could not be loaded.');
			})
			.finally(() => {
				if (!request.signal.aborted) setPending(false);
			});
		return () => {
			request.abort();
			controller.current?.abort();
		};
	}, [memberId]);

	function more() {
		setPending(true);
		setError(null);
		controller.current?.abort();
		const request = new AbortController();
		controller.current = request;
		const nextCursor = page?.nextCursor ?? null;
		void requestHistory(memberId, nextCursor, request.signal)
			.then((result) => {
				if (request.signal.aborted) return;
				setPage((current) => {
					const known = new Set(current?.items.map((item) => item.id));
					return {
						...result,
						items: [
							...(current?.items ?? []),
							...result.items.filter((item) => !known.has(item.id)),
						],
					};
				});
			})
			.catch((failure: unknown) => {
				if (request.signal.aborted) return;
				setError(failure instanceof Error ? failure.message : 'Plan history could not be loaded.');
			})
			.finally(() => {
				if (!request.signal.aborted) setPending(false);
			});
	}

	return (
		<section className={styles.history} aria-label="Plan registration history" aria-busy={pending}>
			<div className={styles.heading}>
				<h4>Membership history</h4>
				<p>Plans registered for this member, including previous terms.</p>
			</div>
			{page?.items.length ? (
				<div className={styles.list}>
					{page.items.map((item) => (
						<article key={item.id} className={styles.registration}>
							<div className={styles.registrationTop}>
								<h5>{item.planName}</h5>
								<span className={styles.status} data-status={item.status}>
									{item.status.toLowerCase()}
								</span>
							</div>
							<dl className={styles.terms}>
								<div>
									<dt>Period</dt>
									<dd>
										<time dateTime={item.startDate}>{formatDate(item.startDate)}</time>
										{' – '}
										<time dateTime={item.endDate}>{formatDate(item.endDate)}</time>
									</dd>
								</div>
								<div>
									<dt>Duration</dt>
									<dd>
										{item.periodCount} {item.periodUnit.toLowerCase()}
									</dd>
								</div>
								<div>
									<dt>Plan price</dt>
									<dd>
										{amountFormatter.format(item.price)} {item.currency}
									</dd>
								</div>
							</dl>
						</article>
					))}
				</div>
			) : null}
			{page?.items.length === 0 ? (
				<p className={styles.empty}>No plan registrations recorded.</p>
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

async function requestHistory(
	memberId: string,
	cursor: string | null,
	signal: AbortSignal,
): Promise<MemberSubscriptionList> {
	const suffix = cursor === null ? '' : `?cursor=${encodeURIComponent(cursor)}`;
	return memberRequest(
		`${routes.memberSubscriptionsApi(memberId)}${suffix}`,
		memberSubscriptionListSchema,
		{ signal },
	);
}
