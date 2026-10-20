'use client';

import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useId, useState, type InputHTMLAttributes } from 'react';

import styles from './input.module.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
	readonly error?: string;
	readonly focusStyle?: 'subtle';
	readonly hint?: string;
	readonly icon: IconSvgElement;
	readonly label: string;
}

export function Input({
	className,
	error,
	focusStyle,
	hint,
	icon,
	id,
	label,
	type = 'text',
	...props
}: InputProps) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const descriptionId = error || hint ? `${inputId}-description` : undefined;
	const isPassword = type === 'password';
	const [passwordVisible, setPasswordVisible] = useState(false);

	return (
		<div className={styles.field}>
			<label htmlFor={inputId}>{label}</label>
			<div
				className={styles.control}
				data-invalid={error ? 'true' : undefined}
				data-focus-style={focusStyle}
			>
				<span className={styles.leadingIcon} aria-hidden="true">
					<HugeiconsIcon icon={icon} size={18} strokeWidth={1.7} />
				</span>
				<input
					{...props}
					id={inputId}
					type={isPassword && passwordVisible ? 'text' : type}
					className={className}
					aria-invalid={error ? true : props['aria-invalid']}
					aria-describedby={descriptionId ?? props['aria-describedby']}
				/>
				{isPassword ? (
					<button
						type="button"
						className={styles.visibility}
						onClick={() => setPasswordVisible((visible) => !visible)}
						aria-label={passwordVisible ? 'Hide password' : 'Show password'}
						aria-pressed={passwordVisible}
					>
						<HugeiconsIcon
							icon={passwordVisible ? ViewOffIcon : ViewIcon}
							size={18}
							strokeWidth={1.7}
							aria-hidden="true"
						/>
					</button>
				) : null}
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
