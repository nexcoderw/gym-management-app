'use client';

import { ArrowDown01Icon, Calendar03Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

import { FilterSheet } from '@/components/shared/filter-sheet';
import { FilterToolbar } from '@/components/shared/filter-toolbar';
import { Input } from '@/components/shared/input';
import { Select } from '@/components/shared/select';
import type { MemberStatus } from '@/lib/contracts';

import styles from './members-toolbar.module.css';

export type MemberOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

interface MenuOption<T extends string> {
	readonly value: T;
	readonly label: string;
}

const statuses: readonly MenuOption<MemberStatus>[] = [
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'ARCHIVED', label: 'Archived' },
];

const orders: readonly MenuOption<MemberOrder>[] = [
	{ value: 'newest', label: 'Newest first' },
	{ value: 'oldest', label: 'Oldest first' },
	{ value: 'name-asc', label: 'Name: A to Z' },
	{ value: 'name-desc', label: 'Name: Z to A' },
];

export function MembersToolbar({
	visibleCount,
	loadedCount,
	hasMore,
	status,
	order,
	term,
	fromDate,
	toDate,
	pending,
	error,
	onTermChange,
	onFiltersApply,
}: {
	readonly visibleCount: number;
	readonly loadedCount: number;
	readonly hasMore: boolean;
	readonly status: MemberStatus;
	readonly order: MemberOrder;
	readonly term: string;
	readonly fromDate: string;
	readonly toDate: string;
	readonly pending: boolean;
	readonly error: boolean;
	readonly onTermChange: (term: string) => void;
	readonly onFiltersApply: (
		status: MemberStatus,
		order: MemberOrder,
		fromDate: string,
		toDate: string,
	) => void;
}) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [draftStatus, setDraftStatus] = useState(status);
	const [draftOrder, setDraftOrder] = useState(order);
	const [draftFromDate, setDraftFromDate] = useState(fromDate);
	const [draftToDate, setDraftToDate] = useState(toDate);
	const needle = term.trim();
	const datesInvalid = draftFromDate !== '' && draftToDate !== '' && draftFromDate > draftToDate;
	const filtersChanged =
		draftStatus !== status ||
		draftOrder !== order ||
		draftFromDate !== fromDate ||
		draftToDate !== toDate;

	function openFilters() {
		setDraftStatus(status);
		setDraftOrder(order);
		setDraftFromDate(fromDate);
		setDraftToDate(toDate);
		setFiltersOpen(true);
	}

	function applyFilters() {
		onFiltersApply(draftStatus, draftOrder, draftFromDate, draftToDate);
		setFiltersOpen(false);
	}

	const summary =
		pending && loadedCount === 0
			? 'Loading member profiles…'
			: error && loadedCount === 0
				? 'Member profiles unavailable'
				: needle
					? `${visibleCount} matching profile${visibleCount === 1 ? '' : 's'} loaded for “${needle}”`
					: `${loadedCount} loaded ${status.toLowerCase()} profile${loadedCount === 1 ? '' : 's'}`;

	return (
		<FilterToolbar
			summary={`${summary}${hasMore && !error ? ' · More profiles available' : ''}`}
			term={term}
			searchLabel="Search members"
			searchInputLabel="Search loaded members"
			searchPlaceholder="Search members…"
			onTermChange={onTermChange}
			filtersOpen={filtersOpen}
			onOpenFilters={openFilters}
		>
			<FilterSheet
				open={filtersOpen}
				title="Filter members"
				description="Choose which members to show and how to order them."
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
					<Input
						label="Registered from"
						icon={Calendar03Icon}
						focusStyle="subtle"
						type="date"
						value={draftFromDate}
						max={draftToDate || undefined}
						onChange={(event) => setDraftFromDate(event.target.value)}
					/>
					<Input
						label="Registered through"
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
