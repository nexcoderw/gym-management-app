'use client';

import { Cancel01Icon, Money01Icon, PackageIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import {
	membershipPlanInputSchema,
	type MembershipPlan,
	type MembershipPlanInput,
} from '@/lib/contracts';
import styles from './membership-form.module.css';

type FieldErrors = Partial<Record<keyof MembershipPlanInput, string>>;

export function MembershipForm({
	initialPlan,
	onCancel,
	onSubmit,
	pending,
}: {
	readonly initialPlan?: MembershipPlan;
	readonly onCancel: () => void;
	readonly onSubmit: (input: MembershipPlanInput) => Promise<void>;
	readonly pending: boolean;
}) {
	const [name, setName] = useState(initialPlan?.name ?? '');
	const [price, setPrice] = useState(initialPlan === undefined ? '' : String(initialPlan.price));
	const [description, setDescription] = useState(initialPlan?.description ?? '');
	const [errors, setErrors] = useState<FieldErrors>({});

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending) return;
		const result = membershipPlanInputSchema.safeParse({ name, price, description });
		if (!result.success) {
			const fields = result.error.flatten().fieldErrors;
			setErrors({
				name: fields.name?.[0],
				price: fields.price?.[0],
				description: fields.description?.[0],
			});
			return;
		}
		setErrors({});
		await onSubmit(result.data);
	}

	return (
		<form className={styles.form} onSubmit={submit} noValidate>
			<Input
				label="Membership name"
				icon={PackageIcon}
				value={name}
				onChange={(event) => setName(event.target.value)}
				error={errors.name}
				maxLength={120}
				autoComplete="off"
				autoFocus
				required
			/>
			<Input
				label="Price (RWF)"
				icon={Money01Icon}
				value={price}
				onChange={(event) => setPrice(event.target.value)}
				error={errors.price}
				inputMode="numeric"
				pattern="[0-9]*"
				autoComplete="off"
				required
			/>
			<div className={styles.field}>
				<label htmlFor="membership-description">
					Activities and description <span>Optional</span>
				</label>
				<textarea
					id="membership-description"
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					aria-invalid={errors.description ? true : undefined}
					aria-describedby={
						errors.description ? 'membership-description-error' : 'membership-description-hint'
					}
					maxLength={1000}
					rows={4}
					placeholder="For example: gym access, group classes and one assessment"
				/>
				{errors.description ? (
					<p id="membership-description-error" className={styles.error} role="alert">
						{errors.description}
					</p>
				) : (
					<p id="membership-description-hint" className={styles.hint}>
						List the activities included in this membership.
					</p>
				)}
			</div>
			<div className={styles.actions}>
				<Button
					type="button"
					variant="secondary"
					width="small"
					icon={Cancel01Icon}
					onClick={onCancel}
					disabled={pending}
				>
					Cancel
				</Button>
				<Button type="submit" width="medium" icon={Tick02Icon} pending={pending}>
					{initialPlan === undefined ? 'Add membership' : 'Save changes'}
				</Button>
			</div>
		</form>
	);
}
