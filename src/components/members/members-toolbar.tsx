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
	pending,
	error,
	onTermChange,
	onStatusChange,
	onOrderChange,
}: {
	readonly visibleCount: number;
	readonly loadedCount: number;
	readonly hasMore: boolean;
	readonly status: MemberStatus;
	readonly order: MemberOrder;
	readonly term: string;
	readonly pending: boolean;
	readonly error: boolean;
	readonly onTermChange: (term: string) => void;
	readonly onStatusChange: (status: MemberStatus) => void;
	readonly onOrderChange: (order: MemberOrder) => void;
}) {
	const needle = term.trim();

	const summary =
		pending && loadedCount === 0
			? 'Loading member profiles…'
			: error && loadedCount === 0
				? 'Member profiles unavailable'
				: needle
					? `${visibleCount} of ${loadedCount} loaded profiles match “${needle}”`
					: `${loadedCount} loaded ${status.toLowerCase()} profile${loadedCount === 1 ? '' : 's'}`;

	return (
		<div className={styles.toolbar}>
			<p className={styles.summary} role="status">
				{summary}
				{hasMore && !error ? ' · More profiles available' : ''}
			</p>

			<div className={styles.tools}>
				<MemberSearch term={term} onTermChange={onTermChange} />

				<ToolbarMenu
					label="Filter by status"
					icon={FilterIcon}
					value={status}
					options={statuses}
					onChange={onStatusChange}
				/>

				<ToolbarMenu
					label="Sort members"
					icon={ArrowDown01Icon}
					value={order}
					options={orders}
					onChange={onOrderChange}
				/>
			</div>
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
		<div
			className={styles.search}
			data-open={open}
			role={open ? 'search' : undefined}
		>
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
				<HugeiconsIcon
					icon={Search01Icon}
					size={18}
					aria-hidden="true"
				/>
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

function ToolbarMenu<T extends string>({
	label,
	icon,
	value,
	options,
	onChange,
}: {
	readonly label: string;
	readonly icon: IconSvgElement;
	readonly value: T;
	readonly options: readonly MenuOption<T>[];
	readonly onChange: (value: T) => void;
}) {
	const [open, setOpen] = useState(false);
	const menuId = useId();
	const wrapper = useRef<HTMLDivElement>(null);

	const currentLabel = options.find((option) => option.value === value)?.label ?? label;

	useEffect(() => {
		if (!open) return;

		function outside(event: PointerEvent) {
			if (
				event.target instanceof Node &&
				wrapper.current?.contains(event.target)
			) {
				return;
			}

			setOpen(false);
		}

		document.addEventListener('pointerdown', outside);

		return () => document.removeEventListener('pointerdown', outside);
	}, [open]);

	function close() {
		setOpen(false);
		wrapper.current
			?.querySelector<HTMLButtonElement>('[data-trigger]')
			?.focus();
	}

	function choose(next: T) {
		close();
		if (next !== value) onChange(next);
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

		const index = buttons.findIndex(
			(button) => button === document.activeElement,
		);
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
				const destination = event.relatedTarget;

				if (
					!(destination instanceof Node) ||
					!event.currentTarget.contains(destination)
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
				aria-label={`${label}: ${currentLabel}`}
				aria-expanded={open}
				aria-controls={open ? menuId : undefined}
				onClick={() => setOpen((current) => !current)}
			>
				{`${label}: ${currentLabel}`}
			</Button>

			{open ? (
				<div
					id={menuId}
					className={styles.menu}
					role="group"
					aria-label={label}
				>
					<p className={styles.menuHeading}>{label}</p>

					{options.map((option) => {
						const selected = option.value === value;

						return (
							<button
								key={option.value}
								type="button"
								className={styles.option}
								data-option
								aria-pressed={selected}
								autoFocus={selected}
								onClick={() => choose(option.value)}
							>
								<span className={styles.check} aria-hidden="true">
									{selected ? (
										<HugeiconsIcon icon={Tick02Icon} size={16} />
									) : null}
								</span>

								{option.label}
							</button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}