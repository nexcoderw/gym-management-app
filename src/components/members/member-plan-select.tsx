'use client';

import { ArrowDown01Icon, Package01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { Select } from '@/components/shared/select';
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
			<Select
				label="Membership plan"
				icon={Package01Icon}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				error={error ?? failure ?? undefined}
				hint={
					plans.length === 0 && !pending
						? 'Create an active membership plan before registering a member.'
						: 'The selected price is recorded with this registration.'
				}
				required
				disabled={pending}
			>
				<option value="">{pending ? 'Loading plans…' : 'Choose a membership plan'}</option>
				{plans
					.filter((plan) => plan.status === 'ACTIVE')
					.map((plan) => (
						<option key={plan.id} value={plan.id}>
							{plan.name} — {new Intl.NumberFormat('en-RW').format(plan.price)} RWF
						</option>
					))}
			</Select>
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
