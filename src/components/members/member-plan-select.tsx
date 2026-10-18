'use client';

import { RefreshIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { routes } from '@/constants/routes';
import { membershipPlanListSchema, type MembershipPlan } from '@/lib/contracts';
import { memberRequest } from './member-requests';
import styles from './member-form.module.css';

export function MemberPlanSelect({
	value,
	onChange,
	error,
}: {
	readonly value: string;
	readonly onChange: (id: string) => void;
	readonly error?: string;
}) {
	const id = useId();
	const [plans, setPlans] = useState<MembershipPlan[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [pending, setPending] = useState(true);
	const [failure, setFailure] = useState<string | null>(null);
	const controller = useRef<AbortController | null>(null);

	useEffect(() => {
		const request = new AbortController();
		controller.current = request;
		void requestPlans(null, request.signal)
			.then((page) => {
				if (request.signal.aborted) return;
				setPlans(page.items);
				setCursor(page.nextCursor);
				setFailure(null);
			})
			.catch(() => {
				if (!request.signal.aborted) {
					setFailure('Membership plans could not be loaded. Try again.');
				}
			})
			.finally(() => {
				if (!request.signal.aborted) setPending(false);
			});
		return () => {
			request.abort();
			controller.current?.abort();
		};
	}, []);

	function reload() {
		setPending(true);
		setFailure(null);
		controller.current?.abort();
		const request = new AbortController();
		controller.current = request;
		void requestPlans(cursor, request.signal)
			.then((page) => {
				if (request.signal.aborted) return;
				setPlans((current) => {
					const known = new Set(current.map((plan) => plan.id));
					return cursor === null
						? page.items
						: [...current, ...page.items.filter((plan) => !known.has(plan.id))];
				});
				setCursor(page.nextCursor);
			})
			.catch(() => {
				if (!request.signal.aborted) {
					setFailure('Membership plans could not be loaded. Try again.');
				}
			})
			.finally(() => {
				if (!request.signal.aborted) setPending(false);
			});
	}

	return (
		<div className={styles.field}>
			<label htmlFor={id}>Membership plan</label>
			<select
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				required
				aria-invalid={Boolean(error)}
				aria-describedby={`${id}-hint`}
				disabled={pending}
			>
				<option value="">{pending ? 'Loading plans…' : 'Choose an active plan'}</option>
				{plans
					.filter((plan) => plan.status === 'ACTIVE')
					.map((plan) => (
						<option key={plan.id} value={plan.id}>
							{plan.name} — {new Intl.NumberFormat('en-RW').format(plan.price)} RWF
						</option>
					))}
			</select>
			<p
				id={`${id}-hint`}
				className={error || failure ? styles.error : styles.hint}
				role={error || failure ? 'alert' : undefined}
			>
				{error ??
					failure ??
					(plans.length === 0 && !pending
						? 'Create an active membership plan before registering a member.'
						: 'The server records the current plan price and calculates the end date.')}
			</p>
			{failure || cursor !== null ? (
				<Button
					icon={failure ? RefreshIcon : ArrowDown01Icon}
					variant="secondary"
					pending={pending}
					onClick={reload}
				>
					{failure ? 'Retry plans' : 'Load more plans'}
				</Button>
			) : null}
		</div>
	);
}

async function requestPlans(
	cursor: string | null,
	signal: AbortSignal,
): Promise<ReturnType<typeof membershipPlanListSchema.parse>> {
	const query = new URLSearchParams({ status: 'ACTIVE', limit: '50' });
	if (cursor !== null) query.set('cursor', cursor);
	return memberRequest(`${routes.membershipPlansApi}?${query}`, membershipPlanListSchema, {
		signal,
	});
}
