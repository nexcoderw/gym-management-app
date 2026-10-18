'use client';

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Calendar03Icon,
	Call02Icon,
	Cancel01Icon,
	Mail01Icon,
	Tick02Icon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Select } from '@/components/shared/select';
import {
	memberProfileInputSchema,
	memberRegistrationInputSchema,
	type Member,
	type MemberPeriodUnit,
} from '@/lib/contracts';
import { MemberPlanSelect } from './member-plan-select';
import styles from './member-form.module.css';

export interface MemberFormDraft {
	readonly name: string;
	readonly phoneNumber: string;
	readonly email: string;
	readonly subscription: {
		readonly membershipPlanId: string;
		readonly startDate: string;
		readonly periodUnit: MemberPeriodUnit;
		readonly periodCount: number;
	};
	readonly idempotencyKey: string;
}

export function MemberForm({
	member,
	pending,
	onSubmit,
	onCancel,
}: {
	readonly member?: Member;
	readonly pending: boolean;
	readonly onSubmit: (draft: MemberFormDraft) => Promise<void>;
	readonly onCancel: () => void;
}) {
	const creating = member === undefined;
	const [name, setName] = useState(member?.name ?? '');
	const [phoneNumber, setPhone] = useState(member?.phoneNumber ?? '');
	const [email, setEmail] = useState(member?.email ?? '');
	const [plan, setPlan] = useState('');
	const [startDate, setStart] = useState('');
	const [periodUnit, setUnit] = useState<MemberPeriodUnit>('MONTHS');
	const [periodCount, setCount] = useState('1');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [step, setStep] = useState<1 | 2>(1);
	const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
	const submitting = useRef(false);
	const stepHeading = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (creating && step === 2) stepHeading.current?.focus();
	}, [creating, step]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending || submitting.current) return;
		const profile = { name, phoneNumber, email };

		if (creating && step === 1) {
			const parsedProfile = memberProfileInputSchema.safeParse(profile);
			if (!parsedProfile.success) {
				setErrors(validationMessages(parsedProfile.error.issues));
				return;
			}

			setErrors({});
			setStep(2);
			return;
		}

		const subscription = {
			membershipPlanId: plan,
			startDate,
			periodUnit,
			periodCount: Number(periodCount),
		};
		const fingerprint = JSON.stringify({ ...profile, subscription });
		const previous = attempt.current;
		const key = previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID();
		attempt.current = { fingerprint, key };
		const draft = { ...profile, subscription, idempotencyKey: key };
		const parsed = creating
			? memberRegistrationInputSchema.safeParse(draft)
			: memberProfileInputSchema.safeParse(profile);
		if (!parsed.success) {
			const messages = validationMessages(parsed.error.issues);
			setErrors(messages);
			if (creating && ['name', 'phoneNumber', 'email'].some((field) => field in messages)) {
				setStep(1);
			}
			return;
		}
		setErrors({});
		submitting.current = true;
		try {
			await onSubmit(draft);
		} finally {
			submitting.current = false;
		}
	}

	return (
		<form className={styles.form} onSubmit={submit} noValidate>
			{creating ? (
				<ol className={styles.steps} aria-label="Member registration progress">
					<li
						aria-current={step === 1 ? 'step' : undefined}
						data-complete={step > 1 ? 'true' : undefined}
					>
						<span aria-hidden="true">1</span>
						<strong>Contact</strong>
					</li>
					<li aria-current={step === 2 ? 'step' : undefined}>
						<span aria-hidden="true">2</span>
						<strong>Membership</strong>
					</li>
				</ol>
			) : null}

			<fieldset className={styles.fieldset} disabled={pending}>
				{!creating || step === 1 ? (
					<div className={styles.stepPanel}>
						{creating ? <h3>Contact details</h3> : null}
						<Input
							label="Member name"
							icon={UserIcon}
							value={name}
							onChange={(event) => setName(event.target.value)}
							error={errors.name}
							placeholder="e.g. Jean Uwimana"
							maxLength={160}
							autoComplete="name"
							required
							autoFocus
						/>
						<Input
							label="Phone number"
							icon={Call02Icon}
							value={phoneNumber}
							onChange={(event) => setPhone(event.target.value)}
							error={errors.phoneNumber}
							placeholder="e.g. +250 788 123 456"
							maxLength={40}
							type="tel"
							autoComplete="tel"
							required
						/>
						<Input
							label="Email (optional)"
							icon={Mail01Icon}
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							error={errors.email}
							placeholder="e.g. jean@example.com"
							maxLength={254}
							type="email"
							autoComplete="email"
						/>
					</div>
				) : (
					<div className={styles.stepPanel}>
						<h3 ref={stepHeading} tabIndex={-1}>
							Membership details
						</h3>
						<MemberPlanSelect value={plan} onChange={setPlan} error={errors.membershipPlanId} />
						<Input
							label="Start date"
							icon={Calendar03Icon}
							type="date"
							value={startDate}
							onChange={(event) => setStart(event.target.value)}
							error={errors.startDate}
							placeholder="YYYY-MM-DD"
							min="2000-01-01"
							max="2099-12-31"
							required
						/>
						<div className={styles.row}>
							<Input
								label="Period"
								icon={Calendar03Icon}
								type="number"
								value={periodCount}
								onChange={(event) => setCount(event.target.value)}
								error={errors.periodCount}
								placeholder="e.g. 1"
								min={1}
								step={1}
								required
							/>
							<Select
								label="Duration"
								icon={Calendar03Icon}
								value={periodUnit}
								onChange={(event) => setUnit(event.target.value as MemberPeriodUnit)}
								error={errors.periodUnit}
							>
								<option value="DAYS">Days</option>
								<option value="WEEKS">Weeks</option>
								<option value="MONTHS">Months</option>
								<option value="YEARS">Years</option>
							</Select>
						</div>
						<p className={styles.hint}>
							Registration records agreed plan terms; it does not confirm a payment. The server
							calculates the inclusive end date.
						</p>
					</div>
				)}
			</fieldset>

			<div className={styles.actions}>
				{creating && step === 2 ? (
					<Button
						icon={ArrowLeft01Icon}
						variant="secondary"
						width="small"
						disabled={pending}
						onClick={() => setStep(1)}
					>
						Back
					</Button>
				) : (
					<Button
						icon={Cancel01Icon}
						variant="secondary"
						width="small"
						disabled={pending}
						onClick={onCancel}
					>
						Cancel
					</Button>
				)}
				<Button
					icon={creating && step === 1 ? ArrowRight01Icon : Tick02Icon}
					type="submit"
					pending={pending}
				>
					{creating && step === 1 ? 'Continue' : creating ? 'Add member' : 'Save changes'}
				</Button>
			</div>
		</form>
	);
}

function validationMessages(
	issues: readonly { readonly path: readonly PropertyKey[]; message: string }[],
) {
	const messages: Record<string, string> = {};
	for (const issue of issues) {
		const field = issue.path.at(-1);
		if (typeof field === 'string') messages[field] ??= issue.message;
	}
	return messages;
}
