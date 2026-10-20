import { Calendar03Icon, ChartLineData01Icon } from '@hugeicons/core-free-icons';

import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { routes } from '@/constants/routes';
import type { PaymentReportSummary } from '@/lib/contracts';

import { PaymentReportDownload } from './payment-report-download';
import styles from './payment-report-workspace.module.css';

interface PaymentReportWorkspaceProps {
	readonly fromDate: string;
	readonly toDate: string;
	readonly status: 'idle' | 'invalid' | 'unavailable' | 'ready';
	readonly message: string | null;
	readonly fromDateError?: string;
	readonly toDateError?: string;
	readonly summary: PaymentReportSummary | null;
}

const numberFormat = new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Africa/Kigali',
	day: 'numeric',
	month: 'short',
	year: 'numeric',
});
const timestampFormat = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Africa/Kigali',
	dateStyle: 'medium',
	timeStyle: 'short',
});

function formatAmount(amount: string): string {
	return `${numberFormat.format(BigInt(amount))} RWF`;
}

function formatDate(date: string): string {
	return dateFormat.format(new Date(`${date}T12:00:00.000Z`));
}

function safeDateInput(value: string): string {
	return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : '';
}

export function PaymentReportWorkspace({
	fromDate,
	toDate,
	status,
	message,
	fromDateError,
	toDateError,
	summary,
}: PaymentReportWorkspaceProps) {
	const reportQuery = summary
		? new URLSearchParams({ fromDate: summary.fromDate, toDate: summary.toDate })
		: null;
	const downloadHref = reportQuery ? `${routes.paymentReportPdfApi}?${reportQuery}` : null;

	return (
		<div className={styles.workspace}>
			<section className={styles.rangePanel} aria-labelledby="report-range-title">
				<div className={styles.intro}>
					<h2 id="report-range-title">Choose your reporting period</h2>
					<p>Payments are grouped by the day they were recorded in Africa/Kigali.</p>
				</div>
				<form
					key={`${fromDate}-${toDate}`}
					method="get"
					action={routes.report}
					className={styles.form}
				>
					<div className={styles.fields}>
						<Input
							label="From date"
							name="fromDate"
							type="date"
							icon={Calendar03Icon}
							defaultValue={safeDateInput(fromDate)}
							error={fromDateError}
							required
						/>
						<Input
							label="To date"
							name="toDate"
							type="date"
							icon={Calendar03Icon}
							defaultValue={safeDateInput(toDate)}
							error={toDateError}
							required
						/>
						<div className={styles.submit}>
							<Button type="submit" icon={ChartLineData01Icon} width="full">
								Generate report
							</Button>
						</div>
					</div>
				</form>
				{message ? (
					<p className={styles.message} data-status={status} role="alert">
						{message}
					</p>
				) : null}
			</section>

			{status === 'ready' && summary && downloadHref ? (
				<section className={styles.result} aria-labelledby="report-result-title">
					<div className={styles.resultHeader}>
						<div>
							<h2 id="report-result-title">Payment summary</h2>
							<p>
								{formatDate(summary.fromDate)} – {formatDate(summary.toDate)}
							</p>
						</div>
						<PaymentReportDownload
							href={downloadHref}
							fromDate={summary.fromDate}
							toDate={summary.toDate}
						/>
					</div>
					<div className={styles.figures}>
						<div className={styles.primaryFigure}>
							<p>Net received</p>
							<strong>{formatAmount(summary.netRwf)}</strong>
							<span>Confirmed payments less confirmed refunds</span>
						</div>
						<dl className={styles.breakdown}>
							<div>
								<dt>Gross payments</dt>
								<dd>{formatAmount(summary.grossRwf)}</dd>
							</div>
							<div>
								<dt>Refunded</dt>
								<dd>{formatAmount(summary.refundedRwf)}</dd>
							</div>
							<div>
								<dt>Payments recorded</dt>
								<dd>{numberFormat.format(summary.paymentCount)}</dd>
							</div>
							<div>
								<dt>Settled payments</dt>
								<dd>{numberFormat.format(summary.settledPaymentCount)}</dd>
							</div>
						</dl>
					</div>
					<p className={styles.generatedAt}>
						Summary generated {timestampFormat.format(new Date(summary.generatedAt))} (Kigali
						time). The PDF is generated when downloaded and contains the full payment list, without
						pagination.
					</p>
				</section>
			) : status === 'idle' ? (
				<div className={styles.prompt}>
					<p>Select both dates to see your gym’s payment totals and download the full report.</p>
				</div>
			) : null}
		</div>
	);
}
