'use client';

import {
	Add01Icon,
	ArrowDown01Icon,
	Cancel01Icon,
	Invoice01Icon,
	RefreshIcon,
} from '@hugeicons/core-free-icons';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/shared/button';
import { Dialog } from '@/components/shared/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Toast, type ToastNotice } from '@/components/shared/toast';
import { routes } from '@/constants/routes';
import {
	paymentListSchema,
	paymentSchema,
	type Payment,
	type PaymentOrder,
	type RegisterPaymentInput,
} from '@/lib/contracts';
import { PaymentForm } from './payment-form';
import { paymentErrorMessage, paymentRequest, PaymentRequestError } from './payment-requests';
import {
	PaymentToolbar,
	type PaymentFilterSelection,
	type PaymentMethodFilter,
	type PaymentStatusFilter,
} from './payment-toolbar';
import styles from './payments-workspace.module.css';

export function PaymentsWorkspace({
	initialItems,
	initialNextCursor,
	initialErrorStatus,
}: {
	readonly initialItems: Payment[];
	readonly initialNextCursor: string | null;
	readonly initialErrorStatus: number | null;
}) {
	const [items, setItems] = useState(initialItems);
	const [nextCursor, setNextCursor] = useState(initialNextCursor);
	const [errorStatus, setErrorStatus] = useState(initialErrorStatus);
	const [status, setStatus] = useState<PaymentStatusFilter>('ALL');
	const [method, setMethod] = useState<PaymentMethodFilter>('ALL');
	const [order, setOrder] = useState<PaymentOrder>('NEWEST');
	const [term, setTerm] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [loading, setLoading] = useState<'idle' | 'page' | 'more'>('idle');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [details, setDetails] = useState<Payment | null>(null);
	const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const noticeId = useRef(0);
	const [notice, setNotice] = useState<ToastNotice | null>(null);
	const requestId = useRef(0);
	const controller = useRef<AbortController | null>(null);
	const dismissToast = useCallback(() => setNotice(null), []);
	useEffect(
		() => () => {
			controller.current?.abort();
		},
		[],
	);
	const needle = term.trim().toLocaleLowerCase('en');
	const visible = items.filter(
		(payment) =>
			!needle ||
			[payment.memberName, payment.receiptNumber, payment.providerReference ?? ''].some((value) =>
				value.toLocaleLowerCase('en').includes(needle),
			),
	);

	function notify(message: string, tone: ToastNotice['tone']) {
		noticeId.current += 1;
		setNotice({ id: noticeId.current, message, tone });
	}

	async function load(
		next: {
			status: PaymentStatusFilter;
			method: PaymentMethodFilter;
			order: PaymentOrder;
			fromDate?: string;
			toDate?: string;
		},
		append = false,
		preserveExisting = false,
	) {
		if (append && (nextCursor === null || loading !== 'idle')) return;
		controller.current?.abort();
		const active = new AbortController();
		controller.current = active;
		requestId.current += 1;
		const currentId = requestId.current;
		setLoading(append ? 'more' : 'page');
		if (!append && !preserveExisting) {
			setItems([]);
			setNextCursor(null);
		}
		const query = new URLSearchParams({ order: next.order, limit: '24' });
		if (next.status !== 'ALL') query.set('status', next.status);
		if (next.method !== 'ALL') query.set('method', next.method);
		if (next.fromDate) query.set('fromDate', next.fromDate);
		if (next.toDate) query.set('toDate', next.toDate);
		if (append && nextCursor) query.set('cursor', nextCursor);
		try {
			const page = await paymentRequest(`${routes.paymentsApi}?${query}`, paymentListSchema, {
				signal: active.signal,
			});
			if (currentId !== requestId.current) return;
			setItems((existing) =>
				append
					? [
							...existing,
							...page.items.filter((payment) => !existing.some((known) => known.id === payment.id)),
						]
					: page.items,
			);
			setNextCursor(page.nextCursor);
			setErrorStatus(null);
		} catch (error: unknown) {
			if (active.signal.aborted || currentId !== requestId.current) return;
			if (!append && !preserveExisting) {
				setErrorStatus(error instanceof PaymentRequestError ? error.status : 503);
			}
			notify('Payments could not be loaded. Try again.', 'error');
		} finally {
			if (currentId === requestId.current) {
				setLoading('idle');
				controller.current = null;
			}
		}
	}

	function applyFilters(selection: PaymentFilterSelection) {
		setStatus(selection.status);
		setMethod(selection.method);
		setOrder(selection.order);
		setFromDate(selection.fromDate);
		setToDate(selection.toDate);
		void load(selection);
	}
	function changeTerm(value: string) {
		setTerm(value);
	}

	async function create(input: RegisterPaymentInput) {
		setCreating(true);
		setCreateError(null);
		try {
			const created = await paymentRequest(routes.paymentRegistrationsApi, paymentSchema, {
				method: 'POST',
				body: JSON.stringify(input),
			});
			setDialogOpen(false);
			setStatus('ALL');
			setMethod('ALL');
			setOrder('NEWEST');
			setTerm('');
			setFromDate('');
			setToDate('');
			setItems([created]);
			setNextCursor(null);
			setErrorStatus(null);
			notify(
				created.status === 'PENDING'
					? `Payment ${created.receiptNumber} recorded as pending.`
					: `Payment ${created.receiptNumber} recorded and confirmed.`,
				'success',
			);
			void load({ status: 'ALL', method: 'ALL', order: 'NEWEST' }, false, true);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : paymentErrorMessage(503);
			setCreateError(message);
			notify(message, 'error');
		} finally {
			setCreating(false);
		}
	}

	async function openDetails(paymentId: string) {
		if (detailsLoading !== null) return;
		setDetailsLoading(paymentId);
		try {
			setDetails(await paymentRequest(routes.paymentApi(paymentId), paymentSchema));
		} catch (error: unknown) {
			notify(error instanceof Error ? error.message : paymentErrorMessage(503), 'error');
		} finally {
			setDetailsLoading(null);
		}
	}

	const showToolbar =
		items.length > 0 ||
		nextCursor !== null ||
		status !== 'ALL' ||
		method !== 'ALL' ||
		order !== 'NEWEST' ||
		term !== '' ||
		fromDate !== '' ||
		toDate !== '';
	const filteredEmpty =
		status !== 'ALL' || method !== 'ALL' || term.trim() !== '' || fromDate !== '' || toDate !== '';
	const failure = errorStatus !== null;
	return (
		<div className={styles.page}>
			<PageHeader
				title="Payments"
				description="Register members, record plan payments and review this gym’s ledger."
				actions={
					items.length > 0 ? (
						<Button icon={Add01Icon} onClick={() => setDialogOpen(true)}>
							New payment
						</Button>
					) : undefined
				}
			/>
			<section className={styles.workspace} aria-label="Payments ledger">
				{showToolbar ? (
					<PaymentToolbar
						count={visible.length}
						hasMore={nextCursor !== null}
						term={term}
						fromDate={fromDate}
						toDate={toDate}
						status={status}
						method={method}
						order={order}
						onTermChange={changeTerm}
						onFiltersApply={applyFilters}
					/>
				) : null}
				{loading === 'page' ? (
					<p className={styles.loading} role="status">
						Loading payments…
					</p>
				) : failure ? (
					<EmptyState
						icon={Invoice01Icon}
						role="alert"
						title="Payments unavailable"
						description={paymentErrorMessage(errorStatus ?? 503)}
						action={
							<Button
								icon={RefreshIcon}
								pending={loading !== 'idle'}
								onClick={() => void load({ status, method, order, fromDate, toDate })}
							>
								Refresh payments
							</Button>
						}
					/>
				) : visible.length === 0 ? (
					<EmptyState
						icon={Invoice01Icon}
						title={filteredEmpty ? 'No matching payments' : 'Record your first payment'}
						description={
							filteredEmpty
								? nextCursor !== null && term.trim() !== ''
									? 'No loaded payments match. Load more payments or change your search.'
									: 'Change your search or filters to see more of the ledger.'
								: 'Add a member or choose an existing one, select a plan and record its payment.'
						}
						action={
							filteredEmpty ? (
								<Button
									icon={Cancel01Icon}
									variant="secondary"
									onClick={() => {
										setTerm('');
										setStatus('ALL');
										setMethod('ALL');
										setFromDate('');
										setToDate('');
										void load({ status: 'ALL', method: 'ALL', order });
									}}
								>
									Clear filters
								</Button>
							) : (
								<Button icon={Add01Icon} onClick={() => setDialogOpen(true)}>
									New payment
								</Button>
							)
						}
					/>
				) : (
					<div className={styles.tableScroll}>
						<table className={styles.table}>
							<caption className={styles.srOnly}>Payments for the current gym</caption>
							<thead>
								<tr>
									<th scope="col">Receipt</th>
									<th scope="col">Member</th>
									<th scope="col">Plan</th>
									<th scope="col">Start date</th>
									<th scope="col">End date</th>
									<th scope="col">Date</th>
									<th scope="col">Method</th>
									<th scope="col">Status</th>
									<th scope="col" className={styles.amount}>
										Amount
									</th>
								</tr>
							</thead>
							<tbody>
								{visible.map((payment) => (
									<tr key={payment.id}>
										<td>
											<button
												type="button"
												className={styles.receipt}
												disabled={detailsLoading !== null}
												onClick={() => void openDetails(payment.id)}
												aria-label={`View payment ${payment.receiptNumber}`}
											>
												{payment.receiptNumber}
											</button>
										</td>
										<td>{payment.memberName}</td>
										<td>{payment.allocations.map((item) => item.planName).join(', ')}</td>
										<td>
											{payment.allocations.map((item) => (
												<time key={`${item.subscriptionId}-start`} dateTime={item.startDate}>
													{item.startDate}
												</time>
											))}
										</td>
										<td>
											{payment.allocations.map((item) => (
												<time key={`${item.subscriptionId}-end`} dateTime={item.endDate}>
													{item.endDate}
												</time>
											))}
										</td>
										<td>
											<time dateTime={payment.occurredAt}>
												{new Intl.DateTimeFormat('en-RW', {
													dateStyle: 'medium',
													timeZone: 'Africa/Kigali',
												}).format(new Date(payment.occurredAt))}
											</time>
										</td>
										<td>{methodLabel(payment.method)}</td>
										<td>
											<span className={styles.status} data-status={payment.status}>
												{statusLabel(payment.status)}
											</span>
										</td>
										<td className={styles.amount}>
											{new Intl.NumberFormat('en-RW').format(payment.amount)} <span>RWF</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{nextCursor !== null && !failure ? (
					<div className={styles.more}>
						<Button
							icon={ArrowDown01Icon}
							variant="secondary"
							pending={loading === 'more'}
							onClick={() => void load({ status, method, order, fromDate, toDate }, true)}
						>
							Load more
						</Button>
					</div>
				) : null}
			</section>
			{dialogOpen ? (
				<Dialog
					open
					title="New payment"
					description="Register a membership and record its full plan price."
					onClose={() => {
						if (!creating) {
							setDialogOpen(false);
							setCreateError(null);
						}
					}}
				>
					<PaymentForm
						pending={creating}
						submissionError={createError}
						onSubmit={create}
						onCancel={() => setDialogOpen(false)}
					/>
				</Dialog>
			) : null}
			{details ? (
				<Dialog
					open
					title={details.receiptNumber}
					description="Payment details"
					onClose={() => setDetails(null)}
				>
					<dl className={styles.details}>
						<div>
							<dt>Member</dt>
							<dd>{details.memberName}</dd>
						</div>
						<div>
							<dt>Amount</dt>
							<dd>{new Intl.NumberFormat('en-RW').format(details.amount)} RWF</dd>
						</div>
						<div>
							<dt>Status</dt>
							<dd>{statusLabel(details.status)}</dd>
						</div>
						<div>
							<dt>Method</dt>
							<dd>{methodLabel(details.method)}</dd>
						</div>
						<div>
							<dt>Received (Kigali)</dt>
							<dd>
								{new Intl.DateTimeFormat('en-RW', {
									dateStyle: 'medium',
									timeStyle: 'short',
									timeZone: 'Africa/Kigali',
								}).format(new Date(details.occurredAt))}
							</dd>
						</div>
						{details.allocations.map((allocation) => (
							<div key={allocation.subscriptionId}>
								<dt>Allocated to</dt>
								<dd>
									{allocation.planName} · {new Intl.NumberFormat('en-RW').format(allocation.amount)}{' '}
									RWF
								</dd>
							</div>
						))}
						{details.providerReference ? (
							<div>
								<dt>Provider reference</dt>
								<dd>{details.providerReference}</dd>
							</div>
						) : null}
						{details.note ? (
							<div>
								<dt>Note</dt>
								<dd>{details.note}</dd>
							</div>
						) : null}
					</dl>
				</Dialog>
			) : null}
			{notice ? <Toast key={notice.id} notice={notice} onDismiss={dismissToast} /> : null}
		</div>
	);
}

function methodLabel(method: Payment['method']) {
	return {
		CASH: 'Cash',
		MOBILE_MONEY: 'Mobile money',
		BANK_TRANSFER: 'Bank transfer',
		CARD: 'Card',
		OTHER: 'Other',
	}[method];
}
function statusLabel(status: Payment['status']) {
	return {
		PENDING: 'Pending',
		CONFIRMED: 'Confirmed',
		FAILED: 'Failed',
		VOIDED: 'Voided',
		PARTIALLY_REFUNDED: 'Partially refunded',
		REFUNDED: 'Refunded',
	}[status];
}
