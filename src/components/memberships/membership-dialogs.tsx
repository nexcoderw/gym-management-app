'use client';

import { Archive02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

import { MembershipForm } from '@/components/memberships/membership-form';
import { Button } from '@/components/shared/button';
import { Dialog } from '@/components/shared/dialog';
import type { MembershipPlan, MembershipPlanInput } from '@/lib/contracts';
import styles from './membership-dialogs.module.css';

export function MembershipEditorDialog({
	onClose,
	onSubmit,
	open,
	pending,
	plan,
}: {
	readonly onClose: () => void;
	readonly onSubmit: (input: MembershipPlanInput) => Promise<void>;
	readonly open: boolean;
	readonly pending: boolean;
	readonly plan?: MembershipPlan;
}) {
	const close = pending ? () => undefined : onClose;
	return (
		<Dialog
			open={open}
			onClose={close}
			title={plan === undefined ? 'Create membership' : 'Edit membership'}
			description="Set the offer name, whole-RWF price and included activities."
		>
			<MembershipForm initialPlan={plan} onCancel={close} onSubmit={onSubmit} pending={pending} />
		</Dialog>
	);
}

export function MembershipDetailsDialog({
	onClose,
	open,
	plan,
}: {
	readonly onClose: () => void;
	readonly open: boolean;
	readonly plan: MembershipPlan;
}) {
	return (
		<Dialog open={open} onClose={onClose} title={plan.name} description="Membership details">
			<dl className={styles.details}>
				<div>
					<dt>Price</dt>
					<dd>{formatPrice(plan.price)}</dd>
				</div>
				<div>
					<dt>Status</dt>
					<dd>
						<span className={styles.status} data-status={plan.status}>
							{plan.status.toLowerCase()}
						</span>
					</dd>
				</div>
				<div className={styles.wide}>
					<dt>Activities and description</dt>
					<dd>{plan.description ?? 'No activities or description added.'}</dd>
				</div>
				<div>
					<dt>Created</dt>
					<dd>{formatDate(plan.createdAt)}</dd>
				</div>
				<div>
					<dt>Last updated</dt>
					<dd>{formatDate(plan.updatedAt)}</dd>
				</div>
			</dl>
		</Dialog>
	);
}

export function ArchiveMembershipDialog({
	onArchive,
	onClose,
	open,
	pending,
	plan,
}: {
	readonly onArchive: () => Promise<void>;
	readonly onClose: () => void;
	readonly open: boolean;
	readonly pending: boolean;
	readonly plan: MembershipPlan;
}) {
	const close = pending ? () => undefined : onClose;
	return (
		<Dialog
			open={open}
			onClose={close}
			title="Archive membership"
			description="This keeps historical records intact."
		>
			<div className={styles.confirmation}>
				<p>
					<strong>{plan.name}</strong> will no longer be available for new member assignments.
				</p>
				<p>Existing historical data is retained. Archived memberships cannot be edited.</p>
				<div className={styles.actions}>
					<Button
						variant="secondary"
						width="small"
						icon={Cancel01Icon}
						onClick={close}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						width="medium"
						icon={Archive02Icon}
						onClick={onArchive}
						pending={pending}
					>
						Archive membership
					</Button>
				</div>
			</div>
		</Dialog>
	);
}

function formatPrice(price: number): string {
	return new Intl.NumberFormat('en-RW', {
		style: 'currency',
		currency: 'RWF',
		maximumFractionDigits: 0,
	}).format(price);
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat('en-RW', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Africa/Kigali',
	}).format(new Date(value));
}
