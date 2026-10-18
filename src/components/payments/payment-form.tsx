'use client';

import {
	Cancel01Icon, CreditCardIcon, File01Icon, Money01Icon, Note01Icon, Tick02Icon, UserIcon,
} from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Select } from '@/components/shared/select';
import { routes } from '@/constants/routes';
import {
	memberListSchema, memberSubscriptionListSchema, paymentInputSchema, paymentMethodSchema,
	type Member, type MemberSubscriptionList, type PaymentInput, type PaymentMethod,
} from '@/lib/contracts';
import { paymentRequest } from './payment-requests';
import styles from './payment-form.module.css';

type Subscription = MemberSubscriptionList['items'][number];

export function PaymentForm({ pending, submissionError, onCancel, onSubmit }: {
	readonly pending: boolean;
	readonly submissionError: string | null;
	readonly onCancel: () => void;
	readonly onSubmit: (input: PaymentInput) => Promise<void>;
}) {
	const [members, setMembers] = useState<Member[]>([]);
	const [memberCursor, setMemberCursor] = useState<string | null>(null);
	const [memberError, setMemberError] = useState<string | null>(null);
	const [membersLoading, setMembersLoading] = useState(true);
	const [memberId, setMemberId] = useState('');
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [subscriptionCursor, setSubscriptionCursor] = useState<string | null>(null);
	const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
	const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
	const [subscriptionId, setSubscriptionId] = useState('');
	const [amount, setAmount] = useState('');
	const [method, setMethod] = useState<PaymentMethod>('CASH');
	const [providerReference, setProviderReference] = useState('');
	const [note, setNote] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const attempt = useRef<{ fingerprint: string; key: string; occurredAt: string } | null>(null);
	const inFlight = useRef(false);
	const selectedSubscription = subscriptions.find((item) => item.id === subscriptionId);

	useEffect(() => {
		const controller = new AbortController();
		void loadMembers(null, controller.signal).then((page) => {
			if (controller.signal.aborted) return;
			setMembers(page.items);
			setMemberCursor(page.nextCursor);
			setMemberError(null);
		}).catch(() => {
			if (!controller.signal.aborted) setMemberError('Members could not be loaded. Retry.');
	}).finally(() => {
			if (!controller.signal.aborted) setMembersLoading(false);
	});
		return () => controller.abort();
	}, []);

	useEffect(() => {
		if (!memberId) return;
		const controller = new AbortController();
		void loadSubscriptions(memberId, null, controller.signal).then((page) => {
			if (controller.signal.aborted) return;
			setSubscriptions(page.items);
			setSubscriptionCursor(page.nextCursor);
			setSubscriptionError(null);
		}).catch(() => {
			if (!controller.signal.aborted) setSubscriptionError('Registrations could not be loaded. Retry.');
	}).finally(() => {
			if (!controller.signal.aborted) setSubscriptionsLoading(false);
	});
		return () => controller.abort();
	}, [memberId]);

	async function moreMembers() {
		setMembersLoading(true);
		try {
			const page = await loadMembers(memberCursor, AbortSignal.timeout(30_000));
			setMembers((current) => [...current, ...page.items.filter((item) => !current.some((known) => known.id === item.id))]);
			setMemberCursor(page.nextCursor);
			setMemberError(null);
		} catch {
			setMemberError('Members could not be loaded. Retry.');
		} finally {
			setMembersLoading(false);
		}
	}

	async function moreSubscriptions() {
		if (!memberId) return;
		setSubscriptionsLoading(true);
		try {
			const page = await loadSubscriptions(memberId, subscriptionCursor, AbortSignal.timeout(30_000));
			setSubscriptions((current) => [...current, ...page.items.filter((item) => !current.some((known) => known.id === item.id))]);
			setSubscriptionCursor(page.nextCursor);
			setSubscriptionError(null);
		} catch {
			setSubscriptionError('Registrations could not be loaded. Retry.');
		} finally {
			setSubscriptionsLoading(false);
		}
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending || inFlight.current) return;
		const numericAmount = /^\d+$/u.test(amount.trim()) ? Number(amount.trim()) : NaN;
		if (!Number.isSafeInteger(numericAmount)) {
			setErrors({ amount: 'Enter a whole RWF amount.' });
			return;
		}
		const fingerprint = JSON.stringify({ memberId, subscriptionId, amount: numericAmount, method, providerReference: providerReference.trim(), note: note.trim() });
		const previous = attempt.current;
		const current = previous?.fingerprint === fingerprint ? previous : {
			fingerprint, key: crypto.randomUUID(), occurredAt: new Date().toISOString(),
		};
		attempt.current = current;
		const result = paymentInputSchema.safeParse({
			memberId, subscriptionId, amount: numericAmount, method,
			occurredAt: current.occurredAt, providerReference: providerReference.trim(),
			note: note.trim(), idempotencyKey: current.key,
		});
		if (!result.success) {
			const messages: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path.at(-1);
				if (typeof key === 'string') messages[key] ??= issue.message;
			}
			setErrors(messages);
			return;
		}
		setErrors({});
		inFlight.current = true;
		try { await onSubmit(result.data); } finally { inFlight.current = false; }
	}

	return (
		<form className={styles.form} onSubmit={submit} noValidate>
			<fieldset className={styles.fields} disabled={pending}>
				<Select label="Member" icon={UserIcon} value={memberId} required
					error={errors.memberId ?? memberError ?? undefined}
					onChange={(event) => {
						setMemberId(event.target.value); setSubscriptionId(''); setSubscriptions([]);
						setSubscriptionCursor(null); setSubscriptionError(null); setSubscriptionsLoading(Boolean(event.target.value));
					}}>
					<option value="">{membersLoading && members.length === 0 ? 'Loading members…' : 'Choose a member'}</option>
					{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.phoneNumber}</option>)}
				</Select>
				{memberError || memberCursor ? <Button icon={File01Icon} variant="secondary" pending={membersLoading} onClick={() => void moreMembers()}>{memberError ? 'Retry members' : 'Load more members'}</Button> : null}
				<Select label="Membership registration" icon={File01Icon} value={subscriptionId} required
					disabled={!memberId || subscriptionsLoading}
					error={errors.subscriptionId ?? subscriptionError ?? undefined}
					hint="Select the registration receiving this payment."
					onChange={(event) => setSubscriptionId(event.target.value)}>
					<option value="">{subscriptionsLoading ? 'Loading registrations…' : 'Choose a registration'}</option>
					{subscriptions.filter((item) => item.status !== 'CANCELLED').map((item) => <option key={item.id} value={item.id}>{item.planName} · {item.startDate} · {formatRwf(item.price)}</option>)}
				</Select>
				{subscriptionError || subscriptionCursor ? <Button icon={File01Icon} variant="secondary" pending={subscriptionsLoading} onClick={() => void moreSubscriptions()}>{subscriptionError ? 'Retry registrations' : 'Load more registrations'}</Button> : null}
				{selectedSubscription ? <p className={styles.hint}>Registration price: {formatRwf(selectedSubscription.price)}. Enter the amount received; the server checks the remaining balance.</p> : null}
				<div className={styles.row}>
					<Input label="Amount (RWF)" icon={Money01Icon} inputMode="numeric" value={amount} required
						placeholder="e.g. 30000" error={errors.amount} onChange={(event) => setAmount(event.target.value)} />
					<Select label="Method" icon={CreditCardIcon} value={method}
						onChange={(event) => {
						const selected = paymentMethodSchema.safeParse(event.target.value);
						if (!selected.success) return;
						setMethod(selected.data);
						if (selected.data === 'CASH') setProviderReference('');
					}}>
						<option value="CASH">Cash</option><option value="MOBILE_MONEY">Mobile money</option>
						<option value="BANK_TRANSFER">Bank transfer</option><option value="CARD">Card</option><option value="OTHER">Other</option>
					</Select>
				</div>
				{method !== 'CASH' ? <Input label="Provider reference" icon={File01Icon} value={providerReference} required
					placeholder="Reference from payment provider" maxLength={120} error={errors.providerReference}
					onChange={(event) => setProviderReference(event.target.value)} /> : null}
				<Input label="Note (optional)" icon={Note01Icon} value={note} maxLength={500}
					placeholder="Add a note for this payment" error={errors.note}
					onChange={(event) => setNote(event.target.value)} />
				<p className={styles.hint}>{method === 'CASH' ? 'Cash is confirmed when recorded.' : 'External payments remain pending until a verified provider workflow confirms them.'} The payment time is recorded when you submit.</p>
				{submissionError ? <p className={styles.error} role="alert">{submissionError}</p> : null}
			</fieldset>
			<div className={styles.actions}>
				<Button icon={Cancel01Icon} variant="secondary" width="small" disabled={pending} onClick={onCancel}>Cancel</Button>
				<Button icon={Tick02Icon} type="submit" pending={pending}>Record payment</Button>
			</div>
		</form>
	);
}

function formatRwf(amount: number): string {
	return `${new Intl.NumberFormat('en-RW').format(amount)} RWF`;
}

async function loadMembers(cursor: string | null, signal: AbortSignal) {
	const query = new URLSearchParams({ status: 'ACTIVE', limit: '50' });
	if (cursor) query.set('cursor', cursor);
	return paymentRequest(`${routes.membersApi}?${query}`, memberListSchema, { signal });
}

async function loadSubscriptions(memberId: string, cursor: string | null, signal: AbortSignal) {
	const query = new URLSearchParams();
	if (cursor) query.set('cursor', cursor);
	return paymentRequest(`${routes.memberSubscriptionsApi(memberId)}?${query}`, memberSubscriptionListSchema, { signal });
}
