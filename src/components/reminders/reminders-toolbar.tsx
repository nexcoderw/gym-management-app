'use client';

import { ArrowDown01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

import { FilterSheet } from '@/components/shared/filter-sheet';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { Select } from '@/components/shared/select';

import styles from './reminders-toolbar.module.css';

export type ReminderStatusFilter = 'ALL' | 'READY' | 'QUEUED' | 'SENT' | 'UNAVAILABLE';
export type ReminderOrder = 'SOONEST' | 'LATEST';

const statuses: readonly { value: ReminderStatusFilter; label: string }[] = [
	{ value: 'ALL', label: 'All members' },
	{ value: 'READY', label: 'Ready to remind' },
	{ value: 'QUEUED', label: 'Queued or processing' },
	{ value: 'SENT', label: 'Previously submitted' },
	{ value: 'UNAVAILABLE', label: 'Email unavailable' },
];

const orders: readonly { value: ReminderOrder; label: string }[] = [
	{ value: 'SOONEST', label: 'Expiring soonest' },
	{ value: 'LATEST', label: 'Expiring latest' },
];

export function RemindersToolbar({
	count,
	total,
	term,
	status,
	order,
	onTermChange,
	onFiltersApply,
}: {
	readonly count: number;
	readonly total: number;
	readonly term: string;
	readonly status: ReminderStatusFilter;
	readonly order: ReminderOrder;
	readonly onTermChange: (value: string) => void;
	readonly onFiltersApply: (status: ReminderStatusFilter, order: ReminderOrder) => void;
}) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [draftStatus, setDraftStatus] = useState(status);
	const [draftOrder, setDraftOrder] = useState(order);

	function openFilters() {
		setDraftStatus(status);
		setDraftOrder(order);
		setFiltersOpen(true);
	}

	return (
		<FilterToolbar
			summary={`${count} of ${total} loaded expiring membership${total === 1 ? '' : 's'}`}
			term={term}
			searchLabel="Search reminders"
			searchInputLabel="Search expiring memberships"
			searchPlaceholder="Search members or plans…"
			onTermChange={onTermChange}
			filtersOpen={filtersOpen}
			onOpenFilters={openFilters}
		>
			<FilterSheet
				open={filtersOpen}
				title="Filter reminders"
				description="Choose which expiring memberships to show and how to order them."
				applyDisabled={draftStatus === status && draftOrder === order}
				onClose={() => setFiltersOpen(false)}
				onApply={() => {
					onFiltersApply(draftStatus, draftOrder);
					setFiltersOpen(false);
				}}
			>
				<div className={styles.filterFields}>
					<Select
						label="Status"
						icon={FilterIcon}
						focusStyle="subtle"
						value={draftStatus}
						onChange={(event) => {
							const option = statuses.find((item) => item.value === event.target.value);
							if (option) setDraftStatus(option.value);
						}}
					>
						{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
					</Select>
					<Select
						label="Order"
						icon={ArrowDown01Icon}
						focusStyle="subtle"
						value={draftOrder}
						onChange={(event) => {
							const option = orders.find((item) => item.value === event.target.value);
							if (option) setDraftOrder(option.value);
						}}
					>
						{orders.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
					</Select>
				</div>
			</FilterSheet>
		</FilterToolbar>
	);
}
