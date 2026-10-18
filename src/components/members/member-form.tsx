'use client';

import {
	Calendar03Icon,
	Call02Icon,
	Cancel01Icon,
	Mail01Icon,
	Tick02Icon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import {
	memberProfileInputSchema,
	memberRegistrationInputSchema,
	type Member,
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
		readonly periodUnit: string;
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
	const [name, setName] = useState(member?.name ?? '');
	const [phoneNumber, setPhone] = useState(member?.phoneNumber ?? '');
	const [email, setEmail] = useState(member?.email ?? '');
	const [plan, setPlan] = useState('');
	const [startDate, setStart] = useState('');
	const [periodUnit, setUnit] = useState('MONTHS');
	const [periodCount, setCount] = useState('1');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
	const submitting = useRef(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending || submitting.current) return;
		const subscription = {
			membershipPlanId: plan,
			startDate,
			periodUnit,
			periodCount: Number(periodCount),
		};
		const profile = { name, phoneNumber, email };
		const fingerprint = JSON.stringify({ ...profile, subscription });
		const previous = attempt.current;
		const key = previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID();
		attempt.current = { fingerprint, key };
		const draft = { ...profile, subscription, idempotencyKey: key };
		const parsed =
			member === undefined
				? memberRegistrationInputSchema.safeParse(draft)
				: memberProfileInputSchema.safeParse(profile);
		if (!parsed.success) {
			const messages: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path.at(-1);
				if (typeof field === 'string') messages[field] ??= issue.message;
			}
			setErrors(messages);
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
			<fieldset className={styles.fieldset} disabled={pending}>
				<Input
					label="Member name"
					icon={UserIcon}
					value={name}
					onChange={(event) => setName(event.target.value)}
					error={errors.name}
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
					maxLength={254}
					type="email"
					autoComplete="email"
				/>
				{member === undefined ? (
					<>
						<MemberPlanSelect value={plan} onChange={setPlan} error={errors.membershipPlanId} />
						<Input
							label="Start date"
							icon={Calendar03Icon}
							type="date"
							value={startDate}
							onChange={(event) => setStart(event.target.value)}
							error={errors.startDate}
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
								min={1}
								step={1}
								required
							/>
							<div className={styles.field}>
								<label htmlFor="member-period-unit">Duration unit</label>
								<select
									id="member-period-unit"
									value={periodUnit}
									onChange={(event) => setUnit(event.target.value)}
								>
									<option value="DAYS">Days</option>
									<option value="WEEKS">Weeks</option>
									<option value="MONTHS">Months</option>
									<option value="YEARS">Years</option>
								</select>
							</div>
						</div>
						<p className={styles.hint}>
							Registration records agreed plan terms; it does not confirm a payment. The server
							calculates the inclusive end date.
						</p>
					</>
				) : null}
			</fieldset>
			<div className={styles.actions}>
				<Button
					icon={Cancel01Icon}
					variant="secondary"
					width="small"
					disabled={pending}
					onClick={onCancel}
				>
					Cancel
				</Button>
				<Button icon={Tick02Icon} type="submit" pending={pending}>
					{member === undefined ? 'Add member' : 'Save changes'}
				</Button>
			</div>
		</form>
	);
}
