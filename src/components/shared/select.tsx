'use client';

import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

import styles from './select.module.css';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
	readonly children: ReactNode;
	readonly error?: string;
	readonly focusStyle?: 'subtle';
	readonly hint?: string;
	readonly icon: IconSvgElement;
	readonly label: string;
}

export function Select({
	children,
	className,
	error,
	focusStyle,
	hint,
	icon,
	id,
	label,
	...props
}: SelectProps) {
	const generatedId = useId();
	const selectId = id ?? generatedId;
	const descriptionId = error || hint ? `${selectId}-description` : undefined;

	return (
		<div className={styles.field}>
			<label htmlFor={selectId}>{label}</label>
			<div
				className={styles.control}
				data-invalid={error ? 'true' : undefined}
				data-focus-style={focusStyle}
			>
				<span className={styles.leadingIcon} aria-hidden="true">
					<HugeiconsIcon icon={icon} size={18} strokeWidth={1.7} />
				</span>
				<select
					{...props}
					id={selectId}
					className={className}
					aria-invalid={error ? true : props['aria-invalid']}
					aria-describedby={descriptionId ?? props['aria-describedby']}
				>
					{children}
				</select>
				<span className={styles.trailingIcon} aria-hidden="true">
					<HugeiconsIcon icon={ArrowDown01Icon} size={18} strokeWidth={1.7} />
				</span>
			</div>
			{error ? (
				<p id={descriptionId} className={styles.error} role="alert">
					{error}
				</p>
			) : hint ? (
				<p id={descriptionId} className={styles.hint}>
					{hint}
				</p>
			) : null}
		</div>
	);
}
