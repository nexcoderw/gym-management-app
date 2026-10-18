'use client';

import {
	ArrowDown01Icon,
	Cancel01Icon,
	FilterIcon,
	Search01Icon,
	Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/shared/button';
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
	onStatusChange,
	onOrderChange,
}: {
	readonly count: number;
	readonly total: number;
	readonly hasMore: boolean;
	readonly term: string;
	readonly status: MembershipFilter;
	readonly order: MembershipOrder;
	readonly onTermChange: (value: string) => void;
	readonly onStatusChange: (value: MembershipFilter) => void;
	readonly onOrderChange: (value: MembershipOrder) => void;
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
				{count} of {total} loaded memberships
				{hasMore ? ' · Load more to search and order all plans' : ''}
			</p>
			<div className={styles.tools}>
				<div className={styles.search} data-open={searchOpen} role={searchOpen ? 'search' : undefined}>
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
				<FilterMenu
					label="Status"
					icon={FilterIcon}
					value={status}
					options={statuses}
					onChange={onStatusChange}
				/>
				<FilterMenu
					label="Order"
					icon={ArrowDown01Icon}
					value={order}
					options={orders}
					onChange={onOrderChange}
				/>
			</div>
		</header>
	);
}

function FilterMenu<T extends string>({
	label,
	icon,
	value,
	options,
	onChange,
}: {
	readonly label: string;
	readonly icon: IconSvgElement;
	readonly value: T;
	readonly options: readonly { readonly value: T; readonly label: string }[];
	readonly onChange: (value: T) => void;
}) {
	const [open, setOpen] = useState(false);
	const wrapper = useRef<HTMLDivElement>(null);
	const menuId = useId();
	const currentLabel = options.find((option) => option.value === value)?.label ?? label;

	useEffect(() => {
		if (!open) return;
		function outside(event: PointerEvent) {
			if (event.target instanceof Node && wrapper.current?.contains(event.target)) return;
			setOpen(false);
		}
		document.addEventListener('pointerdown', outside);
		return () => document.removeEventListener('pointerdown', outside);
	}, [open]);

	function close() {
		setOpen(false);
		wrapper.current?.querySelector<HTMLButtonElement>('[data-trigger]')?.focus();
	}

	function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			return;
		}
		const buttons = Array.from(
			event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-option]'),
		);
		const index = buttons.findIndex((button) => button === document.activeElement);
		const last = buttons.length - 1;
		const moves: Record<string, number> = {
			ArrowDown: index >= last ? 0 : index + 1,
			ArrowUp: index <= 0 ? last : index - 1,
			Home: 0,
			End: last,
		};
		const next = moves[event.key];
		if (next === undefined) return;
		event.preventDefault();
		buttons[next]?.focus();
	}

	return (
		<div
			ref={wrapper}
			className={styles.filter}
			onKeyDown={handleKeys}
			onBlur={(event) => {
				if (
					!(event.relatedTarget instanceof Node) ||
					!event.currentTarget.contains(event.relatedTarget)
				) {
					setOpen(false);
				}
			}}
		>
			<Button
				iconOnly
				icon={icon}
				variant="secondary"
				data-trigger
				aria-expanded={open}
				aria-controls={open ? menuId : undefined}
				onClick={() => setOpen((current) => !current)}
			>
				{`${label}: ${currentLabel}`}
			</Button>
			{open ? (
				<div id={menuId} className={styles.menu} role="group" aria-label={label}>
					<p>{label}</p>
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							data-option
							aria-pressed={option.value === value}
							autoFocus={option.value === value}
							onClick={() => {
								onChange(option.value);
								close();
							}}
						>
							<span aria-hidden="true">
								{option.value === value ? <HugeiconsIcon icon={Tick02Icon} size={16} /> : null}
							</span>
							{option.label}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
