import styles from './pagination.module.css';

interface PaginationProps {
	readonly page: number;
	readonly totalPages?: number;
	readonly loadedPages?: number;
	readonly hasNext?: boolean;
	readonly pending?: boolean;
	readonly label: string;
	readonly onPageChange: (page: number) => void;
}

export function Pagination({
	page,
	totalPages,
	loadedPages = 1,
	hasNext = false,
	pending = false,
	label,
	onPageChange,
}: PaginationProps) {
	const availablePages = totalPages ?? loadedPages + (hasNext ? 1 : 0);
	if (availablePages <= 1) return null;

	const numbers = new Set<number>();
	for (let number = 1; number <= Math.min(3, availablePages); number += 1) numbers.add(number);
	for (let number = Math.max(1, availablePages - 2); number <= availablePages; number += 1) {
		numbers.add(number);
	}
	for (let number = Math.max(1, page - 1); number <= Math.min(availablePages, page + 1); number += 1) {
		numbers.add(number);
	}
	const visiblePages = [...numbers].sort((left, right) => left - right);
	const canJumpToLast = totalPages !== undefined || !hasNext;

	return (
		<nav className={styles.pagination} aria-label={`${label} pages`} aria-busy={pending}>
			<button
				type="button"
				className={styles.arrow}
				aria-label="First page"
				disabled={pending || page === 1}
				onClick={() => onPageChange(1)}
			>
				<span aria-hidden="true">«</span>
			</button>
			<button
				type="button"
				className={styles.arrow}
				aria-label="Previous page"
				disabled={pending || page === 1}
				onClick={() => onPageChange(page - 1)}
			>
				<span aria-hidden="true">‹</span>
			</button>
			{visiblePages.map((number, index) => {
				const previous = visiblePages[index - 1];
				const jumpPage = previous === undefined ? null : Math.floor((previous + number) / 2);
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
							aria-label={`Page ${number}`}
							aria-current={number === page ? 'page' : undefined}
							disabled={pending || number === page}
							onClick={() => onPageChange(number)}
						>
							{number}
						</button>
					</div>
				);
			})}
			<button
				type="button"
				className={styles.arrow}
				aria-label="Next page"
				disabled={pending || page >= availablePages}
				onClick={() => onPageChange(page + 1)}
			>
				<span aria-hidden="true">›</span>
			</button>
			{canJumpToLast ? (
				<button
					type="button"
					className={styles.arrow}
					aria-label="Last page"
					disabled={pending || page >= availablePages}
					onClick={() => onPageChange(availablePages)}
				>
					<span aria-hidden="true">»</span>
				</button>
			) : null}
		</nav>
	);
}
