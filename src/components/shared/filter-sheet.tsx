'use client';

import { Cancel01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import { Button } from './button';
import styles from './filter-sheet.module.css';

interface FilterSheetProps {
	readonly children: ReactNode;
	readonly description?: string;
	readonly title: string;
	readonly open: boolean;
	readonly applyDisabled: boolean;
	readonly onApply: () => void;
	readonly onClose: () => void;
}

export function FilterSheet({
	children,
	description,
	title,
	open,
	applyDisabled,
	onApply,
	onClose,
}: FilterSheetProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			previousFocusRef.current =
				document.activeElement instanceof HTMLElement ? document.activeElement : null;
			dialog.showModal();
		}
		if (!open && dialog.open) {
			dialog.close();
			previousFocusRef.current?.focus();
		}
		return () => {
			if (dialog.open) dialog.close();
			previousFocusRef.current?.focus();
		};
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className={styles.sheet}
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<form
				className={styles.panel}
				onSubmit={(event) => {
					event.preventDefault();
					if (!applyDisabled) onApply();
				}}
			>
				<header className={styles.header}>
					<div>
						<h2 id={titleId}>{title}</h2>
						{description ? <p id={descriptionId}>{description}</p> : null}
					</div>
					<button
						type="button"
						className={styles.dismiss}
						aria-label="Close filters"
						onClick={onClose}
					>
						<HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden="true" />
					</button>
				</header>
				<div className={styles.content}>{children}</div>
				<footer className={styles.footer}>
					<Button icon={Cancel01Icon} variant="secondary" width="full" onClick={onClose}>
						Close
					</Button>
					<Button icon={Tick02Icon} type="submit" width="full" disabled={applyDisabled}>
						Apply
					</Button>
				</footer>
			</form>
		</dialog>
	);
}
