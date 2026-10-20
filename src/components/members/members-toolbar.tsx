'use client';

import {
	ArrowDown01Icon,
	Calendar03Icon,
	Cancel01Icon,
	FilterIcon,
	Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/shared/button';
import { FilterSheet } from '@/components/shared/filter-sheet';
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
		<div className={styles.toolbar}>
			<p className={styles.summary} role="status">
				{summary}
				{hasMore && !error ? ' · More profiles available' : ''}
			</p>

			<div className={styles.tools}>
				<MemberSearch term={term} onTermChange={onTermChange} />
				<Button
					iconOnly
					icon={FilterIcon}
					variant="secondary"
					aria-haspopup="dialog"
					aria-expanded={filtersOpen}
					onClick={openFilters}
				>
					Filters
				</Button>
			</div>
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
					<Input
						label="Registered from"
						icon={Calendar03Icon}
						type="date"
						value={draftFromDate}
						max={draftToDate || undefined}
						onChange={(event) => setDraftFromDate(event.target.value)}
					/>
					<Input
						label="Registered through"
						icon={Calendar03Icon}
						type="date"
						value={draftToDate}
						min={draftFromDate || undefined}
						onChange={(event) => setDraftToDate(event.target.value)}
					/>
				</div>
			</FilterSheet>
		</div>
	);
}

function MemberSearch({
	term,
	onTermChange,
}: {
	readonly term: string;
	readonly onTermChange: (term: string) => void;
}) {
	const inputId = useId();
	const toggle = useRef<HTMLButtonElement>(null);
	const input = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);

	function close() {
		onTermChange('');
		setOpen(false);
		toggle.current?.focus();
	}

	return (
		<div className={styles.search} data-open={open} role={open ? 'search' : undefined}>
			<button
				ref={toggle}
				type="button"
				className={styles.searchToggle}
				aria-label="Search members"
				title="Search members"
				aria-expanded={open}
				aria-controls={open ? inputId : undefined}
				onClick={() => {
					if (open) input.current?.focus();
					else setOpen(true);
				}}
			>
				<HugeiconsIcon icon={Search01Icon} size={18} aria-hidden="true" />
			</button>

			{open ? (
				<>
					<input
						ref={input}
						id={inputId}
						type="search"
						className={styles.searchInput}
						value={term}
						placeholder="Search members…"
						aria-label="Search loaded members"
						autoComplete="off"
						spellCheck={false}
						autoFocus
						onChange={(event) => onTermChange(event.target.value)}
						onKeyDown={(event) => {
							if (event.key !== 'Escape') return;

							event.preventDefault();

							if (term) onTermChange('');
							else close();
						}}
					/>

					<Button
						iconOnly
						icon={Cancel01Icon}
						variant="secondary"
						className={styles.searchClose}
						onClick={close}
					>
						Close search
					</Button>
				</>
			) : null}
		</div>
	);
}
