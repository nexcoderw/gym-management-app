import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonWidth = 'full' | 'medium' | 'small';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	readonly children: ReactNode;
	readonly icon: IconSvgElement;
	readonly pending?: boolean;
	readonly variant?: ButtonVariant;
	readonly width?: ButtonWidth;
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	readonly children: ReactNode;
	readonly href: string;
	readonly icon: IconSvgElement;
	readonly variant?: ButtonVariant;
	readonly width?: ButtonWidth;
}

export function Button({
	children,
	className,
	disabled,
	icon,
	pending = false,
	type = 'button',
	variant = 'primary',
	width = 'medium',
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type={type}
			className={joinClassNames(styles.control, className)}
			data-variant={variant}
			data-width={width}
			disabled={disabled || pending}
			aria-busy={pending || undefined}
		>
			<span className={styles.icon} aria-hidden="true">
				{pending ? (
					<span className={styles.spinner} data-loading-indicator />
				) : (
					<HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
				)}
			</span>
			<span>{children}</span>
		</button>
	);
}

export function ButtonLink({
	children,
	className,
	href,
	icon,
	variant = 'secondary',
	width = 'medium',
	...props
}: ButtonLinkProps) {
	return (
		<a
			{...props}
			href={href}
			className={joinClassNames(styles.control, className)}
			data-variant={variant}
			data-width={width}
		>
			<span className={styles.icon} aria-hidden="true">
				<HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
			</span>
			<span>{children}</span>
		</a>
	);
}

function joinClassNames(base: string | undefined, additional?: string) {
	if (!base) return additional;
	return additional ? `${base} ${additional}` : base;
}
