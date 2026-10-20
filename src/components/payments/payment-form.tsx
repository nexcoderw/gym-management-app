'use client';

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Calendar03Icon,
	Call02Icon,
	Cancel01Icon,
	CreditCardIcon,
	File01Icon,
	Mail01Icon,
	Note01Icon,
	RefreshIcon,
	Tick02Icon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { MemberPlanSelect } from '@/components/members/member-plan-select';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Select } from '@/components/shared/select';
import { routes } from '@/constants/routes';
import {
	memberListSchema,
	memberProfileInputSchema,
	memberSchema,
	memberSubscriptionInputSchema,
	paymentMethodSchema,
	registerPaymentInputSchema,
	type Member,
	type MemberPeriodUnit,
	type MembershipPlan,
	type PaymentMethod,
	type RegisterPaymentInput,
} from '@/lib/contracts';

import { paymentEndDate } from './payment-period';
import { paymentRequest } from './payment-requests';
import styles from './payment-form.module.css';

type MemberMode = 'NEW' | 'EXISTING';
type PaymentStep = 1 | 2 | 3;

export function PaymentForm({
	pending,
	submissionError,
	onCancel,
	onSubmit,
}: {
	readonly pending: boolean;
	readonly submissionError: string | null;
	readonly onCancel: () => void;
	readonly onSubmit: (input: RegisterPaymentInput) => Promise<void>;
}) {
	const [step, setStep] = useState<PaymentStep>(1);
	const [mode, setMode] = useState<MemberMode>('NEW');
	const [members, setMembers] = useState<Member[]>([]);
	const [memberCursor, setMemberCursor] = useState<string | null>(null);
	const [membersLoading, setMembersLoading] = useState(false);
	const [memberError, setMemberError] = useState<string | null>(null);
	const [memberId, setMemberId] = useState('');
	const [name, setName] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [email, setEmail] = useState('');
	const [planId, setPlanId] = useState('');
	const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | undefined>();
	const [startDate, setStartDate] = useState('');
	const [periodCount, setPeriodCount] = useState('1');
	const [periodUnit, setPeriodUnit] = useState<MemberPeriodUnit>('MONTHS');
	const [method, setMethod] = useState<PaymentMethod>('CASH');
	const [providerReference, setProviderReference] = useState('');
	const [note, setNote] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const attempt = useRef<{ fingerprint: string; key: string; occurredAt: string } | null>(null);
	const inFlight = useRef(false);
	const stepHeading = useRef<HTMLHeadingElement>(null);
	const endDate = paymentEndDate(startDate, periodUnit, Number(periodCount));

	useEffect(() => {
		if (step > 1) stepHeading.current?.focus();
	}, [step]);

	useEffect(() => {
		if (mode !== 'EXISTING') return;
		const controller = new AbortController();
		void Promise.resolve()
			.then(() => {
				if (controller.signal.aborted) return undefined;
				setMembersLoading(true);
				return loadMembers(null, controller.signal);
			})
			.then((page) => {
				if (page === undefined || controller.signal.aborted) return;
				setMembers(page.items);
				setMemberCursor(page.nextCursor);
				setMemberError(null);
			})
			.catch(() => {
				if (!controller.signal.aborted) setMemberError('Members could not be loaded. Retry.');
			})
			.finally(() => {
				if (!controller.signal.aborted) setMembersLoading(false);
			});
		return () => controller.abort();
	}, [mode]);

	async function moreMembers() {
		setMembersLoading(true);
		try {
			const page = await loadMembers(memberCursor, AbortSignal.timeout(30_000));
			setMembers((current) => {
				const known = new Set(current.map((member) => member.id));
				return [...current, ...page.items.filter((member) => !known.has(member.id))];
			});
			setMemberCursor(page.nextCursor);
			setMemberError(null);
		} catch {
			setMemberError('Members could not be loaded. Retry.');
		} finally {
			setMembersLoading(false);
		}
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending || inFlight.current) return;

		if (step === 1) {
			const memberResult =
				mode === 'NEW'
					? memberProfileInputSchema.safeParse({ name, phoneNumber, email })
					: memberSchema.shape.id.safeParse(memberId);
			if (!memberResult.success) {
				setErrors(
					mode === 'NEW'
						? validationMessages(memberResult.error.issues)
						: { memberId: 'Choose a member.' },
				);
				return;
			}
			setErrors({});
			setStep(2);
			return;
		}

		const subscription = {
			membershipPlanId: planId,
			startDate,
			periodUnit,
			periodCount: Number(periodCount),
		};
		if (step === 2) {
			const subscriptionResult = memberSubscriptionInputSchema.safeParse(subscription);
			if (!subscriptionResult.success) {
				setErrors(validationMessages(subscriptionResult.error.issues));
				return;
			}
			if (selectedPlan?.price === 0) {
				setErrors({ membershipPlanId: 'A free plan cannot be recorded as a payment.' });
				return;
			}
			setErrors({});
			setStep(3);
			return;
		}

		const fingerprint = JSON.stringify({
			mode,
			memberId,
			name,
			phoneNumber,
			email,
			subscription,
			method,
			providerReference: providerReference.trim(),
			note: note.trim(),
		});
		const previous = attempt.current;
		const current =
			previous?.fingerprint === fingerprint
				? previous
				: { fingerprint, key: crypto.randomUUID(), occurredAt: new Date().toISOString() };
		attempt.current = current;
		const result = registerPaymentInputSchema.safeParse({
			...(mode === 'NEW' ? { member: { name, phoneNumber, email } } : { memberId }),
			subscription,
			method,
			occurredAt: current.occurredAt,
			providerReference: providerReference.trim(),
			note: note.trim(),
			idempotencyKey: current.key,
		});
		if (!result.success) {
			const messages = validationMessages(result.error.issues);
			setErrors(messages);
			if (hasAny(messages, ['name', 'phoneNumber', 'email', 'memberId'])) setStep(1);
			else if (hasAny(messages, ['membershipPlanId', 'startDate', 'periodUnit', 'periodCount'])) {
				setStep(2);
			}
			return;
		}
		setErrors({});
		inFlight.current = true;
		try {
			await onSubmit(result.data);
		} finally {
			inFlight.current = false;
		}
	}

	return (
		<form className={styles.form} onSubmit={submit} noValidate>
			<ol className={styles.steps} aria-label="Payment registration progress">
				<li aria-current={step === 1 ? 'step' : undefined} data-complete={step > 1 || undefined}>
					<span aria-hidden="true">1</span>
					<strong>Member</strong>
				</li>
				<li aria-current={step === 2 ? 'step' : undefined} data-complete={step > 2 || undefined}>
					<span aria-hidden="true">2</span>
					<strong>Membership</strong>
				</li>
				<li aria-current={step === 3 ? 'step' : undefined}>
					<span aria-hidden="true">3</span>
					<strong>Payment</strong>
				</li>
			</ol>

			<fieldset className={styles.fields} disabled={pending}>
				{step === 1 ? (
					<div className={styles.stepPanel}>
						<h3>Member details</h3>
						<Select
							label="Member type"
							icon={UserIcon}
							value={mode}
							onChange={(event) => {
								setMode(event.target.value === 'EXISTING' ? 'EXISTING' : 'NEW');
								setErrors({});
							}}
						>
							<option value="NEW">New member</option>
							<option value="EXISTING">Existing member</option>
						</Select>
						{mode === 'EXISTING' ? (
							<>
								<Select
									label="Member"
									icon={UserIcon}
									value={memberId}
									onChange={(event) => setMemberId(event.target.value)}
									error={errors.memberId ?? memberError ?? undefined}
									required
								>
									<option value="">
										{membersLoading && members.length === 0
											? 'Loading members…'
											: 'Choose a member'}
									</option>
									{members.map((member) => (
										<option key={member.id} value={member.id}>
											{member.name} · {member.phoneNumber}
										</option>
									))}
								</Select>
								{memberError || memberCursor ? (
									<Button
										icon={RefreshIcon}
										variant="secondary"
										pending={membersLoading}
										onClick={() => void moreMembers()}
									>
										{memberError ? 'Retry members' : 'Load more members'}
									</Button>
								) : null}
							</>
						) : (
							<>
								<Input
									label="Full name"
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
									onChange={(event) => setPhoneNumber(event.target.value)}
									error={errors.phoneNumber}
									placeholder="e.g. +250 788 123 456"
									type="tel"
									maxLength={40}
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
									type="email"
									maxLength={254}
									autoComplete="email"
								/>
							</>
						)}
					</div>
				) : step === 2 ? (
					<div className={styles.stepPanel}>
						<h3 ref={stepHeading} tabIndex={-1}>
							Membership details
						</h3>
						<MemberPlanSelect
							value={planId}
							onChange={(id, plan) => {
								setPlanId(id);
								setSelectedPlan(plan);
							}}
							error={errors.membershipPlanId}
						/>
						<Input
							label="Start date"
							icon={Calendar03Icon}
							type="date"
							value={startDate}
							onChange={(event) => setStartDate(event.target.value)}
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
								onChange={(event) => setPeriodCount(event.target.value)}
								error={errors.periodCount}
								min={1}
								step={1}
								required
							/>
							<Select
								label="Duration"
								icon={Calendar03Icon}
								value={periodUnit}
								onChange={(event) => setPeriodUnit(event.target.value as MemberPeriodUnit)}
								error={errors.periodUnit}
							>
								<option value="DAYS">Days</option>
								<option value="WEEKS">Weeks</option>
								<option value="MONTHS">Months</option>
								<option value="YEARS">Years</option>
							</Select>
						</div>
						<p className={styles.hint} role="status">
							{endDate
								? `Ends on ${endDate} (inclusive). The server confirms this date.`
								: 'The end date is calculated from the start date and duration.'}
						</p>
					</div>
				) : (
					<div className={styles.stepPanel}>
						<h3 ref={stepHeading} tabIndex={-1}>
							Payment details
						</h3>
						{selectedPlan ? (
							<p className={styles.total}>
								Plan price <strong>{formatRwf(selectedPlan.price)}</strong>
							</p>
						) : null}
						<Select
							label="Payment method"
							icon={CreditCardIcon}
							value={method}
							onChange={(event) => {
								const selected = paymentMethodSchema.safeParse(event.target.value);
								if (!selected.success) return;
								setMethod(selected.data);
								if (selected.data === 'CASH') setProviderReference('');
							}}
						>
							<option value="CASH">Cash</option>
							<option value="MOBILE_MONEY">Mobile money</option>
							<option value="BANK_TRANSFER">Bank transfer</option>
							<option value="CARD">Card</option>
							<option value="OTHER">Other</option>
						</Select>
						{method !== 'CASH' ? (
							<Input
								label="Provider reference"
								icon={File01Icon}
								value={providerReference}
								onChange={(event) => setProviderReference(event.target.value)}
								error={errors.providerReference}
								placeholder="Reference from the payment provider"
								maxLength={120}
								required
							/>
						) : null}
						<Input
							label="Note (optional)"
							icon={Note01Icon}
							value={note}
							onChange={(event) => setNote(event.target.value)}
							error={errors.note}
							placeholder="Add a note for this payment"
							maxLength={500}
						/>
						<p className={styles.hint}>
							{method === 'CASH'
								? 'Cash is confirmed when recorded.'
								: 'External payments stay pending until a verified provider workflow confirms them.'}
						</p>
					</div>
				)}
				{submissionError ? (
					<p className={styles.error} role="alert">
						{submissionError}
					</p>
				) : null}
			</fieldset>

			<div className={styles.actions}>
				{step === 1 ? (
					<Button
						icon={Cancel01Icon}
						variant="secondary"
						width="small"
						disabled={pending}
						onClick={onCancel}
					>
						Cancel
					</Button>
				) : (
					<Button
						icon={ArrowLeft01Icon}
						variant="secondary"
						width="small"
						disabled={pending}
						onClick={() => setStep((current) => (current === 3 ? 2 : 1))}
					>
						Back
					</Button>
				)}
				<Button icon={step === 3 ? Tick02Icon : ArrowRight01Icon} type="submit" pending={pending}>
					{step === 3 ? 'Register and record payment' : 'Continue'}
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

function hasAny(messages: Readonly<Record<string, string>>, fields: readonly string[]): boolean {
	return fields.some((field) => field in messages);
}

function formatRwf(amount: number): string {
	return `${new Intl.NumberFormat('en-RW').format(amount)} RWF`;
}

async function loadMembers(cursor: string | null, signal: AbortSignal) {
	const query = new URLSearchParams({ status: 'ACTIVE', limit: '24' });
	if (cursor) query.set('cursor', cursor);
	return paymentRequest(`${routes.membersApi}?${query}`, memberListSchema, { signal });
}
