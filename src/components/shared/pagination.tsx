import styles from './pagination.module.css';

interface PaginationProps {
	readonly page: number;
	readonly loadedPages: number;
	readonly hasNext: boolean;
	readonly pending?: boolean;
	readonly label: string;
	readonly onPageChange: (page: number) => void;
}

export function Pagination({
	page,
	loadedPages,
	hasNext,
	pending = false,
	label,
	onPageChange,
}: PaginationProps) {
	const availablePages = loadedPages + (hasNext ? 1 : 0);
	if (availablePages <= 1) return null;

	const first = Math.max(1, Math.min(page - 2, availablePages - 4));
	const last = Math.min(availablePages, first + 4);
	const pages = Array.from({ length: last - first + 1 }, (_, index) => first + index);

	return (
		<nav className={styles.pagination} aria-label={`${label} pages`} aria-busy={pending}>
			<button
				type="button"
				className={styles.arrow}
				aria-label="Previous page"
				disabled={pending || page === 1}
				onClick={() => onPageChange(page - 1)}
			>
				<span aria-hidden="true">‹</span>
			</button>
			{first > 1 ? (
				<>
					<button type="button" className={styles.number} aria-label="Page 1" disabled={pending} onClick={() => onPageChange(1)}>
						1
					</button>
					{first > 2 ? <span className={styles.ellipsis} aria-hidden="true">…</span> : null}
				</>
			) : null}
			{pages.map((number) => (
				<button
					key={number}
					type="button"
					className={styles.number}
					aria-label={`Page ${number}`}
					aria-current={number === page ? 'page' : undefined}
					disabled={pending || number === page}
					onClick={() => onPageChange(number)}
				>
					{number}
				</button>
			))}
			{last < availablePages ? (
				<>
					{last < availablePages - 1 ? <span className={styles.ellipsis} aria-hidden="true">…</span> : null}
					<button
						type="button"
						className={styles.number}
						aria-label={`Page ${availablePages}`}
						disabled={pending}
						onClick={() => onPageChange(availablePages)}
					>
						{availablePages}
					</button>
				</>
			) : null}
			<button
				type="button"
				className={styles.arrow}
				aria-label="Next page"
				disabled={pending || page >= availablePages}
				onClick={() => onPageChange(page + 1)}
			>
				<span aria-hidden="true">›</span>
			</button>
		</nav>
	);
}
