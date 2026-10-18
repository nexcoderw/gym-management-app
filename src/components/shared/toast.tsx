'use client';

import { Alert02Icon, Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef } from 'react';

import styles from './toast.module.css';

export interface ToastNotice {
	readonly id: number;
	readonly message: string;
	readonly tone: 'success' | 'error';
}

export function Toast({
	notice,
	onDismiss,
}: {
	readonly notice: ToastNotice;
	readonly onDismiss: () => void;
}) {
	const toastRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timeout = window.setTimeout(onDismiss, notice.tone === 'success' ? 4500 : 7000);
		return () => window.clearTimeout(timeout);
	}, [notice, onDismiss]);

	useEffect(() => {
		const toast = toastRef.current;
		if (toast === null || typeof toast.showPopover !== 'function') return;

		toast.showPopover();
		return () => {
			if (toast.matches(':popover-open')) toast.hidePopover();
		};
	}, []);

	return (
		<div
			ref={toastRef}
			className={styles.toast}
			data-tone={notice.tone}
			popover="manual"
			role={notice.tone === 'error' ? 'alert' : 'status'}
		>
			<HugeiconsIcon
				icon={notice.tone === 'success' ? CheckmarkCircle02Icon : Alert02Icon}
				size={20}
				strokeWidth={1.8}
				aria-hidden="true"
			/>
			<p>{notice.message}</p>
			<button type="button" onClick={onDismiss} aria-label="Dismiss notification">
				<HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
			</button>
		</div>
	);
}
