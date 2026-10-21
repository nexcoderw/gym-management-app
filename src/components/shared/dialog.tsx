'use client';

import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import styles from './dialog.module.css';

export function Dialog({
	children,
	description,
	footer,
	onClose,
	open,
	size = 'default',
	title,
}: {
	readonly children: ReactNode;
	readonly description?: string;
	readonly footer?: ReactNode;
	readonly onClose: () => void;
	readonly open: boolean;
	readonly size?: 'default' | 'wide';
	readonly title: string;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (dialog === null) return;
		if (open && !dialog.open) {
			previousFocusRef.current = document.activeElement as HTMLElement | null;
			dialog.showModal();
		}
		if (!open && dialog.open) dialog.close();
		return () => previousFocusRef.current?.focus();
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className={`${styles.dialog} ${size === 'wide' ? styles.wide : ''}`}
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClose={onClose}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<div className={styles.panel}>
				<header className={styles.header}>
					<div>
						<h2 id={titleId}>{title}</h2>
						{description ? <p id={descriptionId}>{description}</p> : null}
					</div>
					<button
						type="button"
						className={styles.close}
						onClick={onClose}
						aria-label="Close dialog"
					>
						<HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.8} aria-hidden="true" />
					</button>
				</header>
				<div className={styles.content}>{children}</div>
				{footer ? <footer className={styles.footer}>{footer}</footer> : null}
			</div>
		</dialog>
	);
}
