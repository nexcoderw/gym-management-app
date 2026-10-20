'use client';

import { Download01Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

import { Button } from '@/components/shared/button';

import styles from './payment-report-workspace.module.css';

interface PaymentReportDownloadProps {
	readonly href: string;
	readonly fromDate: string;
	readonly toDate: string;
}

export function PaymentReportDownload({ href, fromDate, toDate }: PaymentReportDownloadProps) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function download(): Promise<void> {
		setPending(true);
		setError(null);
		try {
			const response = await fetch(href, {
				cache: 'no-store',
				credentials: 'same-origin',
				signal: AbortSignal.timeout(90_000),
			});
			if (!response.ok) {
				setError(
					response.status === 413
						? 'Choose a shorter date range before downloading the PDF.'
						: response.status === 401
							? 'Your session ended. Sign in again to download the report.'
							: response.status === 403
								? 'You do not have access to download this report.'
								: 'The PDF could not be downloaded. Try again.',
				);
				return;
			}
			if (response.headers.get('content-type')?.split(';')[0] !== 'application/pdf') {
				throw new Error('Unexpected report response.');
			}
			const objectUrl = URL.createObjectURL(await response.blob());
			const anchor = document.createElement('a');
			anchor.href = objectUrl;
			anchor.download = `payments-${fromDate}-to-${toDate}.pdf`;
			document.body.append(anchor);
			anchor.click();
			anchor.remove();
			const revokeObjectURL = URL.revokeObjectURL.bind(URL);
			window.setTimeout(() => revokeObjectURL(objectUrl), 1_000);
		} catch {
			setError('The PDF could not be downloaded. Try again.');
		} finally {
			setPending(false);
		}
	}

	return (
		<div className={styles.download}>
			<Button type="button" icon={Download01Icon} pending={pending} onClick={() => void download()}>
				Download full PDF
			</Button>
			{error ? (
				<p role="alert" className={styles.downloadError}>
					{error}
				</p>
			) : null}
		</div>
	);
}
