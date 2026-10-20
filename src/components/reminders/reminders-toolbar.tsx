'use client';

import { ArrowDown01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

import { FilterSheet } from '@/components/shared/filter-sheet';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { Select } from '@/components/shared/select';
import type { ReminderActivityItem } from '@/lib/contracts';

import styles from './reminders-toolbar.module.css';

export type ReminderStatusFilter = 'ALL' | ReminderActivityItem['status'];
export type ReminderOrder = 'NEWEST' | 'OLDEST';

const statuses: readonly { value: ReminderStatusFilter; label: string }[] = [
	{ value: 'ALL', label: 'All statuses' },
	{ value: 'ACCEPTED', label: 'Submitted' },
	{ value: 'DELIVERED', label: 'Delivered' },
	{ value: 'BOUNCED', label: 'Bounced' },
	{ value: 'FAILED', label: 'Failed' },
	{ value: 'UNCERTAIN', label: 'Needs review' },
];

const orders: readonly { value: ReminderOrder; label: string }[] = [
	{ value: 'NEWEST', label: 'Latest due first' },
	{ value: 'OLDEST', label: 'Earliest due first' },
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

	function applyFilters() {
		onFiltersApply(draftStatus, draftOrder);
		setFiltersOpen(false);
	}

	return (
		<FilterToolbar
			summary={`${count} of ${total} loaded reminder${total === 1 ? '' : 's'}`}
			term={term}
			searchLabel="Search reminders"
			searchInputLabel="Search reminder activity"
			searchPlaceholder="Search members or plans…"
			onTermChange={onTermChange}
			filtersOpen={filtersOpen}
			onOpenFilters={openFilters}
		>
			<FilterSheet
				open={filtersOpen}
				title="Filter reminders"
				description="Choose which reminder activity to show and how to order it."
				applyDisabled={draftStatus === status && draftOrder === order}
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
							const selected = statuses.find((option) => option.value === event.target.value);
							if (selected) setDraftStatus(selected.value);
						}}
					>
						{statuses.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
					<Select
						label="Order"
						icon={ArrowDown01Icon}
						focusStyle="subtle"
						value={draftOrder}
						onChange={(event) => {
							const selected = orders.find((option) => option.value === event.target.value);
							if (selected) setDraftOrder(selected.value);
						}}
					>
						{orders.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
			</FilterSheet>
		</FilterToolbar>
	);
}
