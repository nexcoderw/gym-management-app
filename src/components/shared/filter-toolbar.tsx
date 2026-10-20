'use client';

import { Cancel01Icon, FilterIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useId, useRef, useState, type ReactNode } from 'react';

import { Button } from './button';
import styles from './filter-toolbar.module.css';

interface FilterToolbarProps {
	readonly children: ReactNode;
	readonly filtersOpen: boolean;
	readonly onOpenFilters: () => void;
	readonly onTermChange: (value: string) => void;
	readonly searchInputLabel: string;
	readonly searchLabel: string;
	readonly searchPlaceholder: string;
	readonly summary: string;
	readonly term: string;
}

export function FilterToolbar({
	children,
	filtersOpen,
	onOpenFilters,
	onTermChange,
	searchInputLabel,
	searchLabel,
	searchPlaceholder,
	summary,
	term,
}: FilterToolbarProps) {
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
				{summary}
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
						aria-label={searchLabel}
						title={searchLabel}
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
								aria-label={searchInputLabel}
								placeholder={searchPlaceholder}
								maxLength={80}
								autoComplete="off"
								spellCheck={false}
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
					iconOnly
					icon={FilterIcon}
					variant="secondary"
					aria-haspopup="dialog"
					aria-expanded={filtersOpen}
					onClick={onOpenFilters}
				>
					Filters
				</Button>
			</div>
			{children}
		</header>
	);
}
