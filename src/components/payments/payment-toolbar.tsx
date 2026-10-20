'use client';

import {
	ArrowDown01Icon,
	Calendar03Icon,
	FilterIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { useState } from 'react';

import { FilterSheet } from '@/components/shared/filter-sheet';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { Input } from '@/components/shared/input';
import { Select } from '@/components/shared/select';
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

export interface PaymentFilterSelection {
	readonly status: PaymentStatusFilter;
	readonly method: PaymentMethodFilter;
	readonly order: PaymentOrder;
	readonly fromDate: string;
	readonly toDate: string;
}

export function PaymentToolbar({
	count,
	hasMore,
	term,
	fromDate,
	toDate,
	status,
	method,
	order,
	onTermChange,
	onFiltersApply,
}: {
	readonly count: number;
	readonly hasMore: boolean;
	readonly term: string;
	readonly fromDate: string;
	readonly toDate: string;
	readonly status: PaymentStatusFilter;
	readonly method: PaymentMethodFilter;
	readonly order: PaymentOrder;
	readonly onTermChange: (value: string) => void;
	readonly onFiltersApply: (selection: PaymentFilterSelection) => void;
}) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [draftStatus, setDraftStatus] = useState(status);
	const [draftMethod, setDraftMethod] = useState(method);
	const [draftOrder, setDraftOrder] = useState(order);
	const [draftFromDate, setDraftFromDate] = useState(fromDate);
	const [draftToDate, setDraftToDate] = useState(toDate);
	const datesInvalid = draftFromDate !== '' && draftToDate !== '' && draftFromDate > draftToDate;
	const filtersChanged =
		draftStatus !== status ||
		draftMethod !== method ||
		draftOrder !== order ||
		draftFromDate !== fromDate ||
		draftToDate !== toDate;

	function openFilters() {
		setDraftStatus(status);
		setDraftMethod(method);
		setDraftOrder(order);
		setDraftFromDate(fromDate);
		setDraftToDate(toDate);
		setFiltersOpen(true);
	}

	function applyFilters() {
		onFiltersApply({
			status: draftStatus,
			method: draftMethod,
			order: draftOrder,
			fromDate: draftFromDate,
			toDate: draftToDate,
		});
		setFiltersOpen(false);
	}

	return (
		<FilterToolbar
			summary={`${count} loaded payment${count === 1 ? '' : 's'}${hasMore ? ' · More payments available' : ''}`}
			term={term}
			searchLabel="Search payments"
			searchInputLabel="Search payments by member, receipt or reference"
			searchPlaceholder="Search payments (3+ characters)…"
			onTermChange={onTermChange}
			filtersOpen={filtersOpen}
			onOpenFilters={openFilters}
		>
			<FilterSheet
				open={filtersOpen}
				title="Filter payments"
				description="Choose which payments to show and how to order them."
				applyDisabled={!filtersChanged || datesInvalid}
				onClose={() => setFiltersOpen(false)}
				onApply={applyFilters}
			>
				<div className={styles.filterFields}>
					<Select
						label="Status"
						icon={FilterIcon}
						focusStyle="subtle"
						value={draftStatus}
						onChange={(event) => {
							if (event.target.value === 'ALL') setDraftStatus('ALL');
							else {
								const parsed = paymentStatusSchema.safeParse(event.target.value);
								if (parsed.success) setDraftStatus(parsed.data);
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
					</Select>
					<Select
						label="Method"
						icon={Wallet01Icon}
						focusStyle="subtle"
						value={draftMethod}
						onChange={(event) => {
							if (event.target.value === 'ALL') setDraftMethod('ALL');
							else {
								const parsed = paymentMethodSchema.safeParse(event.target.value);
								if (parsed.success) setDraftMethod(parsed.data);
							}
						}}
					>
						<option value="ALL">All methods</option>
						<option value="CASH">Cash</option>
						<option value="MOBILE_MONEY">Mobile money</option>
						<option value="BANK_TRANSFER">Bank transfer</option>
						<option value="CARD">Card</option>
						<option value="OTHER">Other</option>
					</Select>
					<Select
						label="Order"
						icon={ArrowDown01Icon}
						focusStyle="subtle"
						value={draftOrder}
						onChange={(event) => {
							const parsed = paymentOrderSchema.safeParse(event.target.value);
							if (parsed.success) setDraftOrder(parsed.data);
						}}
					>
						<option value="NEWEST">Newest first</option>
						<option value="OLDEST">Oldest first</option>
						<option value="AMOUNT_HIGH">Highest amount</option>
						<option value="AMOUNT_LOW">Lowest amount</option>
					</Select>
					<Input
						label="Payments from"
						icon={Calendar03Icon}
						focusStyle="subtle"
						type="date"
						value={draftFromDate}
						max={draftToDate || undefined}
						onChange={(event) => setDraftFromDate(event.target.value)}
					/>
					<Input
						label="Payments through"
						icon={Calendar03Icon}
						focusStyle="subtle"
						type="date"
						value={draftToDate}
						min={draftFromDate || undefined}
						onChange={(event) => setDraftToDate(event.target.value)}
					/>
				</div>
			</FilterSheet>
		</FilterToolbar>
	);
}
