'use client';

import { ArrowDown01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

import { FilterSheet } from '@/components/shared/filter-sheet';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { Select } from '@/components/shared/select';
import styles from './membership-toolbar.module.css';

export type MembershipFilter = 'ACTIVE' | 'ARCHIVED';
export type MembershipOrder = 'price-asc' | 'price-desc' | 'name-asc' | 'newest';

const statuses: readonly { value: MembershipFilter; label: string }[] = [
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'ARCHIVED', label: 'Archived' },
];
const orders: readonly { value: MembershipOrder; label: string }[] = [
	{ value: 'price-asc', label: 'Price: low to high' },
	{ value: 'price-desc', label: 'Price: high to low' },
	{ value: 'name-asc', label: 'Name: A to Z' },
	{ value: 'newest', label: 'Newest first' },
];

export function MembershipToolbar({
	count,
	total,
	hasMore,
	term,
	status,
	order,
	onTermChange,
	onFiltersApply,
}: {
	readonly count: number;
	readonly total: number;
	readonly hasMore: boolean;
	readonly term: string;
	readonly status: MembershipFilter;
	readonly order: MembershipOrder;
	readonly onTermChange: (value: string) => void;
	readonly onFiltersApply: (status: MembershipFilter, order: MembershipOrder) => void;
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
			summary={`${count} of ${total} loaded memberships${hasMore ? ' · Load more to search and order all plans' : ''}`}
			term={term}
			searchLabel="Search memberships"
			searchInputLabel="Search loaded memberships by name"
			searchPlaceholder="Search memberships…"
			onTermChange={onTermChange}
			filtersOpen={filtersOpen}
			onOpenFilters={openFilters}
		>
			<FilterSheet
				open={filtersOpen}
				title="Filter memberships"
				description="Choose which plans to show and how to order them."
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
