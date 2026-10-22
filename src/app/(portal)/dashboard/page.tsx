import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { RevenueBarChart } from '@/components/dashboard/revenue-bar-chart';
import { routes } from '@/constants/routes';
import { dashboardQuerySchema, type DashboardAnalytics } from '@/lib/contracts';
import { getDashboardAnalytics } from '@/lib/server/endpoints/dashboard/get-dashboard-analytics';
import { requireOwnerPortalSession } from '@/lib/server/session';
import { UpstreamError } from '@/lib/server/upstream';

import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };

type SearchParams = Record<string, string | string[] | undefined>;
type Change = DashboardAnalytics['metrics']['netCollected']['change'];

const numberFormatter = new Intl.NumberFormat('en-RW');
const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC',
});

function money(value: string): string {
	return numberFormatter.format(BigInt(value));
}

function date(value: string): string {
	return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

function changeLabel(change: Change): string {
	if (change.direction === 'NEW') return 'New vs prior period';
	if (change.percent === null) return 'No comparable baseline';
	if (change.direction === 'UNCHANGED') return 'No change';
	return `${change.direction === 'UP' ? '+' : '−'}${numberFormatter.format(Math.abs(change.percent))}% vs prior period`;
}

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const { organization } = await requireOwnerPortalSession();
	const params = await searchParams;
	const fromDate = typeof params.fromDate === 'string' ? params.fromDate : '';
	const toDate = typeof params.toDate === 'string' ? params.toDate : '';
	const parsed = dashboardQuerySchema.safeParse(params);
	let analytics: DashboardAnalytics | null = null;
	let message: string | null = null;
	if (!parsed.success) {
		message = 'Choose a valid start and end date, with the start no later than the end.';
	} else {
		try {
			analytics = await getDashboardAnalytics(parsed.data);
		} catch (error: unknown) {
			if (error instanceof UpstreamError && error.status === 401) redirect(routes.login);
			message =
				error instanceof UpstreamError && error.status === 403
					? 'Dashboard analytics are not available for this organization.'
					: error instanceof UpstreamError && error.status === 429
						? 'Too many dashboard requests. Please try again shortly.'
						: error instanceof UpstreamError && error.status === 400
							? 'Choose a date range of no more than 366 days ending today or earlier.'
							: 'Dashboard analytics could not be loaded. Please try again.';
		}
	}

	const period = analytics?.period;
	const metrics = analytics?.metrics;
	const series = analytics?.revenueSeries ?? [];

	return (
		<main className={styles.page}>
			<header className={styles.header}>
				<div>
					<p className={styles.eyebrow}>Overview for {organization.name}</p>
					<h1>Dashboard</h1>
					<p className={styles.lead}>
						A clear view of the people and payments moving your gym forward.
					</p>
				</div>
				<form
					action={routes.dashboard}
					method="get"
					className={styles.dateForm}
					aria-label="Dashboard date range"
				>
					<label>
						<span>From</span>
						<input type="date" name="fromDate" defaultValue={fromDate} required />
					</label>
					<label>
						<span>To</span>
						<input type="date" name="toDate" defaultValue={toDate} required />
					</label>
					<button type="submit">Apply dates</button>
					{fromDate || toDate ? <Link href={routes.dashboard}>Current month</Link> : null}
				</form>
			</header>

			{message ? (
				<section className={styles.error} role="alert">
					<h2>Analytics unavailable</h2>
					<p>{message}</p>
					<Link href={routes.dashboard}>Try current month</Link>
				</section>
			) : null}

			{analytics && period && metrics ? (
				<>
					<div className={styles.period}>
						<span>
							{date(period.fromDate)} – {date(period.toDate)}
						</span>
						<span>
							Compared with {date(period.comparisonFromDate)} – {date(period.comparisonToDate)}
						</span>
						<span>All dates in Africa/Kigali</span>
					</div>
					<div className={styles.overview}>
						<section className={styles.hero} aria-labelledby="revenue-heading">
							<div>
								<p className={styles.kicker}>Net collected</p>
								<h2 id="revenue-heading">
									<span>RWF</span> {money(metrics.netCollected.currentRwf)}
								</h2>
								<p className={styles.heroFoot}>
									Gross payments less completed refunds in this period.
								</p>
							</div>
							<div className={styles.heroComparison}>
								<span
									className={styles.delta}
									data-direction={metrics.netCollected.change.direction}
								>
									{changeLabel(metrics.netCollected.change)}
								</span>
								<p>Previous period</p>
								<strong>RWF {money(metrics.netCollected.previousRwf)}</strong>
							</div>
						</section>
						<section className={styles.metricGrid} aria-label="Key metrics">
							{(
								[
									['Settled payments', metrics.settledPayments],
									['New members', metrics.newMembers],
									['Active subscribers', metrics.activeSubscribers],
								] as const
							).map(([label, metric]) => (
								<div className={styles.metric} key={label}>
									<p>{label}</p>
									<strong>{numberFormatter.format(metric.current)}</strong>
									<span data-direction={metric.change.direction}>{changeLabel(metric.change)}</span>
								</div>
							))}
						</section>
					</div>
					<section className={styles.chartPanel} aria-labelledby="trend-heading">
						<div className={styles.sectionHead}>
							<div>
								<p className={styles.kicker}>Performance over time</p>
								<h2 id="trend-heading">Revenue trend</h2>
							</div>
							<span>
								Net RWF ·{' '}
								{period.revenueBucket === 'DAY'
									? 'daily'
									: period.revenueBucket === 'MONTH'
										? 'monthly'
										: '7-day'}{' '}
								buckets
							</span>
						</div>
						{series.length ? (
							<RevenueBarChart points={series} />
						) : (
							<p className={styles.quiet}>No revenue was recorded in this period.</p>
						)}
					</section>
					<div className={styles.breakdowns}>
						<section className={styles.breakdown} aria-labelledby="plans-heading">
							<div className={styles.sectionHead}>
								<div>
									<p className={styles.kicker}>Membership plans</p>
									<h2 id="plans-heading">By membership</h2>
								</div>
							</div>
							{analytics.planTotals.length ? (
								<ol>
									{analytics.planTotals.map((plan) => (
										<li key={plan.planId ?? plan.planName}>
											<span>{plan.planName}</span>
											<strong>RWF {money(plan.grossRwf)}</strong>
										</li>
									))}
								</ol>
							) : (
								<p className={styles.quiet}>No plan payments in this period.</p>
							)}
						</section>
						<section className={styles.breakdown} aria-labelledby="methods-heading">
							<div className={styles.sectionHead}>
								<div>
									<p className={styles.kicker}>Payment methods</p>
									<h2 id="methods-heading">By payment method</h2>
								</div>
							</div>
							{analytics.methodTotals.length ? (
								<ol>
									{analytics.methodTotals.map((method) => (
										<li key={method.method}>
											<span>
												{method.method.replaceAll('_', ' ').toLowerCase()}{' '}
												<small>· {method.settledPaymentCount} payments</small>
											</span>
											<strong>RWF {money(method.grossRwf)}</strong>
										</li>
									))}
								</ol>
							) : (
								<p className={styles.quiet}>No settled payments in this period.</p>
							)}
						</section>
					</div>
				</>
			) : null}
		</main>
	);
}
