import {
	ArrowRight01Icon,
	ChartLineData01Icon,
	CreditCardIcon,
	Tick02Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '@/constants/routes';
import { requireOwnerPortalSession } from '@/lib/server/session';

import styles from './page.module.css';

export const metadata: Metadata = { title: 'Reports' };

// All financial, member and performance values are fictional design samples.
const metrics = [
	{
		label: 'Monthly revenue',
		value: '18.4M',
		unit: 'RWF',
		note: '+12.2% versus September',
		icon: CreditCardIcon,
	},
	{
		label: 'Recorded payments',
		value: '312',
		note: 'Example October transactions',
		icon: Tick02Icon,
	},
	{
		label: 'Active memberships',
		value: '968',
		note: 'Illustrative enrollments',
		icon: UserGroupIcon,
	},
	{
		label: 'Collection rate',
		value: '92.4%',
		note: 'Example of collected dues',
		icon: ChartLineData01Icon,
	},
] as const;

const revenueTrend = [
	{ month: 'May', value: '10,800,000', x: 80, y: 128 },
	{ month: 'Jun', value: '12,300,000', x: 200, y: 113 },
	{ month: 'Jul', value: '14,100,000', x: 320, y: 96 },
	{ month: 'Aug', value: '13,200,000', x: 440, y: 105 },
	{ month: 'Sep', value: '16,400,000', x: 560, y: 74 },
	{ month: 'Oct', value: '18,400,000', x: 680, y: 55 },
] as const;

const monthlyPerformance = [
	{ month: 'May 2026', revenue: '10,800,000', payments: 208, growth: '—', tone: 'neutral' },
	{ month: 'Jun 2026', revenue: '12,300,000', payments: 226, growth: '+13.9%', tone: 'up' },
	{ month: 'Jul 2026', revenue: '14,100,000', payments: 251, growth: '+14.6%', tone: 'up' },
	{ month: 'Aug 2026', revenue: '13,200,000', payments: 243, growth: '−6.4%', tone: 'down' },
	{ month: 'Sep 2026', revenue: '16,400,000', payments: 284, growth: '+24.2%', tone: 'up' },
	{ month: 'Oct 2026', revenue: '18,400,000', payments: 312, growth: '+12.2%', tone: 'up' },
] as const;

const membershipPlans = [
	{ name: 'Flex Monthly', duration: '1 month', active: 470, share: '48.6%', width: 'largest' },
	{ name: 'Quarterly Plus', duration: '3 months', active: 266, share: '27.5%', width: 'second' },
	{ name: 'Annual Prime', duration: '12 months', active: 162, share: '16.7%', width: 'third' },
	{ name: 'Student Pass', duration: '1 month', active: 70, share: '7.2%', width: 'fourth' },
] as const;

const transactions = [
	{
		member: 'Aline Uwase',
		initials: 'AU',
		reference: 'PAY-DEMO-001',
		plan: 'Flex Monthly',
		amount: '15,000',
		method: 'Cash',
		status: 'Confirmed',
	},
	{
		member: 'Eric Niyonsenga',
		initials: 'EN',
		reference: 'PAY-DEMO-002',
		plan: 'Quarterly Plus',
		amount: '42,000',
		method: 'Mobile money',
		status: 'Pending',
	},
	{
		member: 'Sandrine Uwamahoro',
		initials: 'SU',
		reference: 'PAY-DEMO-003',
		plan: 'Annual Prime',
		amount: '150,000',
		method: 'Bank transfer',
		status: 'Pending',
	},
	{
		member: 'Claudine Mukamana',
		initials: 'CM',
		reference: 'PAY-DEMO-004',
		plan: 'Student Pass',
		amount: '10,000',
		method: 'Cash',
		status: 'Confirmed',
	},
] as const;

export default async function ReportPage() {
	const { organization } = await requireOwnerPortalSession();

	return (
		<div className={styles.page}>
			<header className={styles.pageHeader}>
				<div className={styles.heading}>
					<span className={styles.eyebrow}>BUSINESS INTELLIGENCE</span>
					<h1>Reports &amp; analytics</h1>
					<p>
						Explore an illustrative financial and membership performance report for{' '}
						{organization.name}.
					</p>
				</div>
				<div className={styles.headerMeta}>
					<span className={styles.period}>October 2026</span>
					<span className={styles.demoTag}>DEMO DATA</span>
				</div>
			</header>

			<aside className={styles.demoNotice}>
				<span className={styles.noticeIcon} aria-hidden="true">
					<HugeiconsIcon icon={ChartLineData01Icon} size={20} />
				</span>
				<div>
					<strong>Reports design preview</strong>
					<p>
						Every monetary value, percentage, chart, membership count and payment record below is
						fictional. No financial data is being retrieved from your organization ledger.
					</p>
				</div>
			</aside>

			<section className={styles.overview} aria-labelledby="report-overview">
				<div className={styles.sectionHeading}>
					<div>
						<span className={styles.eyebrow}>BUSINESS SNAPSHOT</span>
						<h2 id="report-overview">Performance overview</h2>
					</div>
					<span className={styles.sectionMuted}>Sample reporting period</span>
				</div>

				<div className={styles.metricsGrid}>
					{metrics.map((metric) => (
						<MetricCard key={metric.label} {...metric} />
					))}
				</div>
			</section>

			<section className={styles.analyticsGrid} aria-label="Example financial charts">
				<article className={`${styles.panel} ${styles.revenuePanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>REVENUE ANALYSIS</span>
							<h2>Revenue trend</h2>
							<p>Illustrative revenue in RWF · May–October 2026</p>
						</div>
						<span className={styles.panelBadge}>6 months</span>
					</div>

					<div className={styles.revenueSummary}>
						<div>
							<span>October sample revenue</span>
							<strong>
								18,400,000 <small>RWF</small>
							</strong>
						</div>
						<span className={styles.growthBadge}>+12.2%</span>
					</div>

					<figure className={styles.chartFigure}>
						<svg
							className={styles.revenueChart}
							viewBox="0 0 748 280"
							role="img"
							aria-labelledby="report-revenue-title report-revenue-desc"
						>
							<title id="report-revenue-title">Sample monthly revenue trend</title>
							<desc id="report-revenue-desc">
								Revenue increases from 10.8 million RWF in May to 18.4 million RWF in October,
								including a small decrease in August.
							</desc>

							{[
								{ value: '20M', y: 40 },
								{ value: '15M', y: 88 },
								{ value: '10M', y: 136 },
								{ value: '5M', y: 183 },
								{ value: '0', y: 230 },
							].map((tick) => (
								<g key={tick.value}>
									<line className={styles.gridLine} x1="56" x2="724" y1={tick.y} y2={tick.y} />
									<text className={styles.axisText} x="42" y={tick.y + 4} textAnchor="end">
										{tick.value}
									</text>
								</g>
							))}

							<path
								className={styles.chartArea}
								d="M 80 128 L 200 113 L 320 96 L 440 105 L 560 74 L 680 55 L 680 230 L 80 230 Z"
							/>
							<path
								className={styles.chartLine}
								d="M 80 128 L 200 113 L 320 96 L 440 105 L 560 74 L 680 55"
								pathLength={100}
							/>
							{revenueTrend.map((month) => (
								<g key={month.month}>
									<circle cx={month.x} cy={month.y} r="4" className={styles.chartPoint} />
									<text className={styles.axisText} x={month.x} y="265" textAnchor="middle">
										{month.month}
									</text>
								</g>
							))}
						</svg>
						<figcaption className={styles.chartCaption}>
							<span className={styles.legendMark} />
							Example monthly revenue · RWF millions
						</figcaption>
					</figure>
				</article>

				<article className={`${styles.panel} ${styles.methodsPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>COLLECTION CHANNELS</span>
							<h2>Payment methods</h2>
							<p>Illustrative share of payment value</p>
						</div>
					</div>

					<figure className={styles.donutFigure}>
						<svg viewBox="0 0 200 200" role="img" aria-labelledby="methods-title methods-desc">
							<title id="methods-title">Example payment-method distribution</title>
							<desc id="methods-desc">44% cash, 39% mobile money and 17% bank transfer.</desc>
							<circle className={styles.donutTrack} cx="100" cy="100" r="73" />
							<circle
								className={`${styles.donutSegment} ${styles.donutCash}`}
								cx="100"
								cy="100"
								r="73"
								pathLength={100}
							/>
							<circle
								className={`${styles.donutSegment} ${styles.donutMobile}`}
								cx="100"
								cy="100"
								r="73"
								pathLength={100}
							/>
							<circle
								className={`${styles.donutSegment} ${styles.donutBank}`}
								cx="100"
								cy="100"
								r="73"
								pathLength={100}
							/>
							<text x="100" y="100" className={styles.donutValue} textAnchor="middle">
								3
							</text>
							<text x="100" y="119" className={styles.donutLabel} textAnchor="middle">
								Methods
							</text>
						</svg>
					</figure>

					<div className={styles.methodLegend}>
						<div>
							<span className={styles.legendDot} data-kind="cash" />
							<span>Cash</span>
							<strong>44%</strong>
						</div>
						<div>
							<span className={styles.legendDot} data-kind="mobile" />
							<span>Mobile money</span>
							<strong>39%</strong>
						</div>
						<div>
							<span className={styles.legendDot} data-kind="bank" />
							<span>Bank transfer</span>
							<strong>17%</strong>
						</div>
					</div>
				</article>
			</section>

			<section className={styles.tablesGrid} aria-label="Example performance tables">
				<article className={`${styles.panel} ${styles.monthlyPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>PERIOD COMPARISON</span>
							<h2>Monthly performance</h2>
							<p>Example revenue and payment volume by month</p>
						</div>
					</div>
					<div className={styles.tableScroll}>
						<table className={styles.table}>
							<caption className={styles.visuallyHidden}>
								Illustrative monthly revenue performance
							</caption>
							<thead>
								<tr>
									<th scope="col">Month</th>
									<th scope="col" className={styles.numeric}>
										Revenue (RWF)
									</th>
									<th scope="col" className={styles.numeric}>
										Payments
									</th>
									<th scope="col" className={styles.numeric}>
										Change
									</th>
								</tr>
							</thead>
							<tbody>
								{monthlyPerformance.map((month) => (
									<tr key={month.month}>
										<td className={styles.strongCell}>{month.month}</td>
										<td className={styles.numeric}>{month.revenue}</td>
										<td className={styles.numeric}>{month.payments}</td>
										<td className={styles.numeric}>
											<span className={styles.change} data-tone={month.tone}>
												{month.growth}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</article>

				<article className={`${styles.panel} ${styles.plansPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>MEMBERSHIP PERFORMANCE</span>
							<h2>Active memberships by plan</h2>
							<p>Example distribution of 968 enrollments</p>
						</div>
						<Link href={routes.memberships} className={styles.panelLink}>
							View plans
							<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
						</Link>
					</div>
					<div className={styles.planList}>
						{membershipPlans.map((plan) => (
							<div className={styles.planRow} key={plan.name}>
								<div className={styles.planRowTop}>
									<div>
										<strong>{plan.name}</strong>
										<span>{plan.duration}</span>
									</div>
									<div className={styles.planAmount}>
										<strong>{plan.active}</strong>
										<span>{plan.share}</span>
									</div>
								</div>
								<div className={styles.progressTrack}>
									<span className={styles.progressFill} data-size={plan.width} />
								</div>
							</div>
						))}
					</div>
				</article>
			</section>

			<section className={styles.collectionsSection} aria-labelledby="collection-heading">
				<div className={styles.sectionHeading}>
					<div>
						<span className={styles.eyebrow}>COLLECTION EXAMPLES</span>
						<h2 id="collection-heading">Recent payment records</h2>
						<p>Fictional Rwandan members shown for UI demonstration.</p>
					</div>
					<Link href={routes.payments} className={styles.panelLink}>
						Open payment ledger
						<HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
					</Link>
				</div>

				<div className={`${styles.panel} ${styles.collectionPanel}`}>
					<div className={styles.tableScroll}>
						<table className={styles.table}>
							<caption className={styles.visuallyHidden}>
								Fictional transactions, not records from the gym database
							</caption>
							<thead>
								<tr>
									<th scope="col">Member</th>
									<th scope="col">Reference</th>
									<th scope="col">Plan</th>
									<th scope="col">Method</th>
									<th scope="col" className={styles.numeric}>
										Amount (RWF)
									</th>
									<th scope="col">Status</th>
								</tr>
							</thead>
							<tbody>
								{transactions.map((transaction) => (
									<tr key={transaction.reference}>
										<td>
											<div className={styles.person}>
												<span aria-hidden="true">{transaction.initials}</span>
												<strong>{transaction.member}</strong>
											</div>
										</td>
										<td className={styles.reference}>{transaction.reference}</td>
										<td>{transaction.plan}</td>
										<td>{transaction.method}</td>
										<td className={styles.numeric}>{transaction.amount}</td>
										<td>
											<span className={styles.paymentStatus} data-status={transaction.status}>
												<span aria-hidden="true" />
												{transaction.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className={styles.tableFooter}>
						<span>4 fictional transactions · illustration only</span>
						<Link href={routes.payments}>Go to payments</Link>
					</div>
				</div>
			</section>

			<footer className={styles.footer}>
				<span>Reporting overview · Static preview</span>
				<Link href={routes.dashboard}>
					Back to dashboard
					<HugeiconsIcon icon={ArrowRight01Icon} size={15} aria-hidden="true" />
				</Link>
			</footer>
		</div>
	);
}

function MetricCard({
	label,
	value,
	unit,
	note,
	icon,
}: {
	readonly label: string;
	readonly value: string;
	readonly unit?: string;
	readonly note: string;
	readonly icon: IconSvgElement;
}) {
	return (
		<article className={styles.metric}>
			<div className={styles.metricTop}>
				<span className={styles.metricIcon}>
					<HugeiconsIcon icon={icon} size={21} strokeWidth={1.7} aria-hidden="true" />
				</span>
				<span className={styles.sampleLabel}>SAMPLE</span>
			</div>
			<div>
				<p className={styles.metricLabel}>{label}</p>
				<strong className={styles.metricValue}>
					{unit ? <span>{unit}</span> : null}
					{value}
				</strong>
			</div>
			<p className={styles.metricNote}>{note}</p>
		</article>
	);
}
