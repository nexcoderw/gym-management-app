'use client';

import {
	ArrowDown01Icon,
	Cancel01Icon,
	FilterIcon,
	Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/shared/button';
import {
	paymentMethodSchema,
	paymentOrderSchema,
	paymentStatusSchema,
	type PaymentMethod,
	type PaymentOrder,
	type PaymentStatus,
} from '@/lib/contracts';
import styles from './payment-toolbar.module.css';

export type PaymentStatusFilter = PaymentStatus | 'ALL';
export type PaymentMethodFilter = PaymentMethod | 'ALL';

export function PaymentToolbar({
	count,
	hasMore,
	term,
	status,
	method,
	order,
	onTermChange,
	onStatusChange,
	onMethodChange,
	onOrderChange,
}: {
	readonly count: number;
	readonly hasMore: boolean;
	readonly term: string;
	readonly status: PaymentStatusFilter;
	readonly method: PaymentMethodFilter;
	readonly order: PaymentOrder;
	readonly onTermChange: (value: string) => void;
	readonly onStatusChange: (value: PaymentStatusFilter) => void;
	readonly onMethodChange: (value: PaymentMethodFilter) => void;
	readonly onOrderChange: (value: PaymentOrder) => void;
}) {
	const [searchOpen, setSearchOpen] = useState(false);
	const searchId = useId();
	const toggle = useRef<HTMLButtonElement>(null);
	const input = useRef<HTMLInputElement>(null);

	function closeSearch() {
		onTermChange('');
		setSearchOpen(false);
		toggle.current?.focus();
	}

	return (
		<header className={styles.toolbar}>
			<p className={styles.summary} role="status">
				{count} loaded payment{count === 1 ? '' : 's'}
				{hasMore ? ' · Load more to search all payments' : ''}
			</p>
			<div className={styles.tools}>
				<div
					className={styles.search}
					data-open={searchOpen}
					role={searchOpen ? 'search' : undefined}
				>
					<button
						ref={toggle}
						type="button"
						className={styles.searchToggle}
						aria-label="Search loaded payments"
						aria-expanded={searchOpen}
						aria-controls={searchOpen ? searchId : undefined}
						onClick={() => (searchOpen ? input.current?.focus() : setSearchOpen(true))}
					>
						<HugeiconsIcon icon={Search01Icon} size={18} aria-hidden="true" />
					</button>
					{searchOpen ? (
						<>
							<input
								ref={input}
								id={searchId}
								type="search"
								value={term}
								aria-label="Search loaded payments by member, receipt or reference"
								placeholder="Search payments…"
								autoComplete="off"
								autoFocus
								onChange={(event) => onTermChange(event.target.value)}
								onKeyDown={(event) => {
									if (event.key !== 'Escape') return;
									event.preventDefault();
									if (term) onTermChange('');
									else closeSearch();
								}}
							/>
							<Button iconOnly icon={Cancel01Icon} variant="secondary" onClick={closeSearch}>
								Close search
							</Button>
						</>
					) : null}
				</div>
				<label className={styles.filter}>
					<HugeiconsIcon icon={FilterIcon} size={18} aria-hidden="true" />
					<span className={styles.srOnly}>Payment status</span>
					<select
						value={status}
						onChange={(event) => {
							if (event.target.value === 'ALL') onStatusChange('ALL');
							else {
								const parsed = paymentStatusSchema.safeParse(event.target.value);
								if (parsed.success) onStatusChange(parsed.data);
							}
						}}
					>
						<option value="ALL">All statuses</option>
						<option value="PENDING">Pending</option>
						<option value="CONFIRMED">Confirmed</option>
						<option value="FAILED">Failed</option>
						<option value="VOIDED">Voided</option>
						<option value="PARTIALLY_REFUNDED">Partially refunded</option>
						<option value="REFUNDED">Refunded</option>
					</select>
				</label>
				<label className={styles.filter}>
					<span className={styles.srOnly}>Payment method</span>
					<select
						value={method}
						onChange={(event) => {
							if (event.target.value === 'ALL') onMethodChange('ALL');
							else {
								const parsed = paymentMethodSchema.safeParse(event.target.value);
								if (parsed.success) onMethodChange(parsed.data);
							}
						}}
					>
						<option value="ALL">All methods</option>
						<option value="CASH">Cash</option>
						<option value="MOBILE_MONEY">Mobile money</option>
						<option value="BANK_TRANSFER">Bank transfer</option>
						<option value="CARD">Card</option>
						<option value="OTHER">Other</option>
					</select>
				</label>
				<label className={styles.filter}>
					<HugeiconsIcon icon={ArrowDown01Icon} size={18} aria-hidden="true" />
					<span className={styles.srOnly}>Payment order</span>
					<select
						value={order}
						onChange={(event) => {
							const parsed = paymentOrderSchema.safeParse(event.target.value);
							if (parsed.success) onOrderChange(parsed.data);
						}}
					>
						<option value="NEWEST">Newest first</option>
						<option value="OLDEST">Oldest first</option>
						<option value="AMOUNT_HIGH">Highest amount</option>
						<option value="AMOUNT_LOW">Lowest amount</option>
					</select>
				</label>
			</div>
		</header>
	);
}
