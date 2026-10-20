F'use client';

import { ArrowDown01Icon, Cancel01Icon, FilterIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/shared/button';
import { FilterSheet } from '@/components/shared/filter-sheet';
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
	const [searchOpen, setSearchOpen] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [draftStatus, setDraftStatus] = useState(status);
	const [draftOrder, setDraftOrder] = useState(order);
	const searchId = useId();
	const toggle = useRef<HTMLButtonElement>(null);
	const input = useRef<HTMLInputElement>(null);

	function closeSearch() {
		onTermChange('');
		setSearchOpen(false);
		toggle.current?.focus();
	}

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
		<header className={styles.toolbar}>
			<p className={styles.summary} role="status">
				{count} of {total} loaded memberships
				{hasMore ? ' · Load more to search and order all plans' : ''}
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
						aria-label="Search memberships"
						title="Search memberships"
						aria-expanded={searchOpen}
						aria-controls={searchOpen ? searchId : undefined}
						onClick={() => {
							if (searchOpen) input.current?.focus();
							else setSearchOpen(true);
						}}
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
								aria-label="Search loaded memberships by name"
								placeholder="Search memberships…"
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
				<Button
					icon={FilterIcon}
					variant="secondary"
					width="small"
					aria-haspopup="dialog"
					aria-expanded={filtersOpen}
					onClick={openFilters}
				>
					Filters
				</Button>
			</div>
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
		</header>
	);
}
