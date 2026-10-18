'use client';

import { Archive02Icon, PencilEdit02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { useId } from 'react';

import { Button } from '@/components/shared/button';
import type { MembershipPlan } from '@/lib/contracts';
import styles from './membership-card.module.css';

export type MembershipCardAction = 'details' | 'edit' | 'archive';

const priceFormatter = new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 });

/** First visible character of the plan name; Array.from keeps emoji / surrogate pairs intact. */
function getMonogram(name: string): string {
	return Array.from(name.trim())[0]?.toUpperCase() ?? '';
}

export function MembershipCard({
	plan,
	pendingAction,
	disabled = false,
	onAction,
}: {
	readonly plan: MembershipPlan;
	readonly pendingAction?: MembershipCardAction;
	readonly disabled?: boolean;
	readonly onAction: (action: MembershipCardAction, plan: MembershipPlan) => void;
}) {
	const headingId = useId();
	const monogram = getMonogram(plan.name);

	return (
		<article className={styles.card} data-status={plan.status} aria-labelledby={headingId}>
			{/* Decorative engraved surface + hover sheen, clipped to the card body (not the tab). */}
			<span className={styles.face} aria-hidden="true" />
			<span className={styles.status}>{plan.status.toLowerCase()}</span>
			<header className={styles.heading}>
				{monogram ? (
					<span className={styles.monogram} aria-hidden="true">
						{monogram}
					</span>
				) : null}
				<h3 id={headingId}>{plan.name}</h3>
			</header>
			<div className={styles.price}>
				<strong>{priceFormatter.format(plan.price)}</strong>
				<span>RWF</span>
			</div>
			{/* Perforated ticket stub edge; notches are drawn in CSS. */}
			<div className={styles.divider} aria-hidden="true" />
			<div className={styles.actions} data-busy={pendingAction !== undefined || undefined}>
				<Button
					iconOnly
					icon={ViewIcon}
					variant="secondary"
					aria-label={`View ${plan.name} details`}
					pending={pendingAction === 'details'}
					disabled={disabled}
					onClick={() => onAction('details', plan)}
				>
					Details
				</Button>
				{plan.status === 'ACTIVE' ? (
					<>
						<Button
							iconOnly
							icon={PencilEdit02Icon}
							variant="secondary"
							aria-label={`Edit ${plan.name}`}
							pending={pendingAction === 'edit'}
							disabled={disabled}
							onClick={() => onAction('edit', plan)}
						>
							Edit
						</Button>
						<Button
							iconOnly
							icon={Archive02Icon}
							variant="secondary"
							aria-label={`Archive ${plan.name}`}
							pending={pendingAction === 'archive'}
							disabled={disabled}
							onClick={() => onAction('archive', plan)}
						>
							Archive
						</Button>
					</>
				) : null}
			</div>
		</article>
	);
}