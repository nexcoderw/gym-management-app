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

function barWidth(amount: string, highest: bigint): string {
	if (highest === BigInt(0)) return '0%';
	return `${Number((BigInt(amount) * BigInt(10_000)) / highest) / 100}%`;
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
	const highestPlanTotal = summary?.planTotals.reduce((highest, plan) => {
		const amount = BigInt(plan.grossRwf);
		return amount > highest ? amount : highest;
	}, BigInt(0)) ?? BigInt(0);

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
					<section className={styles.planSection} aria-labelledby="plan-revenue-title">
						<div className={styles.planHeading}>
							<div>
								<h3 id="plan-revenue-title">Gross payments by plan</h3>
								<p>Settled allocations by the plan name recorded at registration.</p>
							</div>
							<span>Gross allocation</span>
						</div>
						{summary.planTotals.length > 0 ? (
							<ol className={styles.planChart} aria-label="Gross payment allocation by plan">
								{summary.planTotals.map((plan) => (
									<li key={`${plan.planId ?? 'other'}-${plan.planName}`}>
										<div className={styles.planLine}>
											<strong>{plan.planName}</strong>
											<span>{formatAmount(plan.grossRwf)}</span>
										</div>
										<div className={styles.barTrack} aria-hidden="true">
											<span
												className={styles.barFill}
												style={{ inlineSize: barWidth(plan.grossRwf, highestPlanTotal) }}
											/>
										</div>
									</li>
								))}
							</ol>
						) : (
							<p className={styles.noPlanRevenue}>
								No settled membership payments were allocated in this period.
							</p>
						)}
						<p className={styles.planNote}>
							Amounts are before refunds. Refunds reduce the net total above but are not attributed
							to individual plans.
						</p>
						{summary.planTotals.some((plan) => plan.planId === null) ? (
							<p className={styles.planNote}>
								Other plans combines additional plans beyond the 24 largest by gross allocation.
							</p>
						) : null}
					</section>
					<p className={styles.generatedAt}>
						Summary generated {timestampFormat.format(new Date(summary.generatedAt))} (Kigali time).
						The PDF is generated when downloaded and contains the full payment list, without
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
