import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PaymentReportWorkspace } from '@/components/reports/payment-report-workspace';
import { PageHeader } from '@/components/shared/page-header';
import { routes } from '@/constants/routes';
import { paymentReportQuerySchema, type PaymentReportSummary } from '@/lib/contracts';
import { getPaymentReportSummary } from '@/lib/server/endpoints/reports/get-payment-report-summary';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

import styles from './page.module.css';

export const metadata: Metadata = { title: 'Payment report' };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ReportPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	await requireOwnerPortalSession();
	const params = await searchParams;
	const fromDate = typeof params.fromDate === 'string' ? params.fromDate : '';
	const toDate = typeof params.toDate === 'string' ? params.toDate : '';
	let summary: PaymentReportSummary | null = null;
	let message: string | null = null;
	let fromDateError: string | undefined;
	let toDateError: string | undefined;
	let status: 'idle' | 'invalid' | 'unavailable' | 'ready' = 'idle';

	if (Object.keys(params).length > 0) {
		const parsed = paymentReportQuerySchema.safeParse(params);
		if (!parsed.success) {
			status = 'invalid';
			for (const issue of parsed.error.issues) {
				if (issue.path[0] === 'fromDate') fromDateError = 'Enter a valid start date.';
				if (issue.path[0] === 'toDate') {
					toDateError =
						issue.code === 'custom'
							? 'End date must be on or after start date.'
							: 'Enter a valid end date.';
				}
			}
			if (!fromDateError && !toDateError) message = 'Use only the report date fields.';
		} else {
			try {
				summary = await getPaymentReportSummary(parsed.data);
				status = 'ready';
			} catch (error: unknown) {
				if (error instanceof UpstreamError && error.status === 401) redirect(routes.login);
				status = 'unavailable';
				message =
					error instanceof UpstreamError && error.status === 403
						? 'You do not have access to payment reports for this gym.'
						: error instanceof UpstreamError && error.status === 429
							? 'Too many report requests. Wait a moment and try again.'
							: 'The payment report could not be loaded. Try again.';
			}
		}
	}

	return (
		<div className={styles.page}>
			<PageHeader
				title="Payment report"
				description="Choose a date range to review payments recorded for your gym."
			/>
			<PaymentReportWorkspace
				fromDate={fromDate}
				toDate={toDate}
				status={status}
				message={message}
				fromDateError={fromDateError}
				toDateError={toDateError}
				summary={summary}
			/>
		</div>
	);
}
