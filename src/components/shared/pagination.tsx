import styles from './pagination.module.css';

interface PaginationProps {
	readonly page: number;
	readonly totalPages?: number;
	readonly loadedPages?: number;
	readonly hasNext?: boolean;
	readonly pending?: boolean;
	readonly label: string;
	readonly totalItems?: number;
	readonly pageSize?: number;
	readonly onPageChange: (page: number) => void;
}

export function Pagination({
	page,
	totalPages,
	loadedPages = 1,
	hasNext = false,
	pending = false,
	label,
	totalItems,
	pageSize,
	onPageChange,
}: PaginationProps) {
	const availablePages = totalPages ?? loadedPages + (hasNext ? 1 : 0);
	if (availablePages <= 1) return null;

	const firstWindowPage = Math.max(1, Math.min(page - 4, availablePages - 4));
	const lastWindowPage = Math.min(availablePages, firstWindowPage + 4);
	const numbers = new Set<number>([1]);
	for (let number = firstWindowPage; number <= lastWindowPage; number += 1) {
		numbers.add(number);
	}
	if (totalPages !== undefined || !hasNext) numbers.add(availablePages);
	const visiblePages = [...numbers].sort((left, right) => left - right);
	const shownCount =
		totalItems !== undefined && pageSize !== undefined
			? Math.min(page * pageSize, totalItems)
			: null;

	return (
		<nav
			className={styles.pagination}
			aria-label={`${label} pages`}
			aria-busy={pending}
			data-has-summary={shownCount !== null}
		>
			<div className={styles.controls}>
				<button
					type="button"
					className={styles.direction}
					aria-label="Previous page"
					disabled={pending || page === 1}
					onClick={() => onPageChange(page - 1)}
				>
					<span className={styles.chevron} aria-hidden="true">‹</span>
					<span>Previous</span>
				</button>
				<div className={styles.pages}>
					{visiblePages.map((number, index) => {
						const previous = visiblePages[index - 1];
						const jumpPage =
							previous === undefined ? null : Math.floor((previous + number) / 2);
						return (
							<div key={number} className={styles.segment}>
								{previous !== undefined && number - previous > 1 && jumpPage !== null ? (
									<button
										type="button"
										className={styles.ellipsis}
										aria-label={`Jump to page ${jumpPage}`}
										disabled={pending}
										onClick={() => onPageChange(jumpPage)}
									>
										…
									</button>
								) : null}
								<button
									type="button"
									className={styles.number}
									aria-label={
										totalPages !== undefined && number === 1
											? 'First page'
											: totalPages !== undefined && number === availablePages
												? 'Last page'
												: `Page ${number}`
									}
									aria-current={number === page ? 'page' : undefined}
									disabled={pending || number === page}
									onClick={() => onPageChange(number)}
								>
									{number}
								</button>
							</div>
						);
					})}
				</div>
				<button
					type="button"
					className={styles.direction}
					aria-label="Next page"
					disabled={pending || page >= availablePages}
					onClick={() => onPageChange(page + 1)}
				>
					<span>Next</span>
					<span className={styles.chevron} aria-hidden="true">›</span>
				</button>
			</div>
			{shownCount !== null && totalItems !== undefined ? (
				<p className={styles.summary} aria-live="polite">
					Showing {shownCount.toLocaleString('en-RW')} of {totalItems.toLocaleString('en-RW')}{' '}
					results
				</p>
			) : null}
		</nav>
	);
}
