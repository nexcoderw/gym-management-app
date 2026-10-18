import {
	ArrowRight01Icon,
	ChartLineData01Icon,
	CreditCardIcon,
	DashboardSquare01Icon,
	Notification01Icon,
	PackageIcon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '@/constants/routes';
import { requireOwnerPortalSession } from '@/lib/server/session';

import styles from './page.module.css';

// All dashboard figures below are fictional UI demonstration data.
// Do not substitute these values for authenticated operational metrics.
const metrics = [
	{
		label: 'Total members',
		value: '1,248',
		change: '+12.8%',
		description: 'Compared with last month',
		icon: UserGroupIcon,
		tone: 'primary',
	},
	{
		label: 'Active memberships',
		value: '968',
		change: '+7.2%',
		description: 'Currently enrolled',
		icon: PackageIcon,
		tone: 'primary',
	},
	{
		label: 'Monthly revenue',
		value: '130k',
		unit: 'RWF',
		change: '+9.4%',
		description: 'Compared with last month',
		icon: CreditCardIcon,
		tone: 'primary',
	},
	{
		label: 'Outstanding balance',
		value: '20k',
		unit: 'RWF',
		change: '−4.1%',
		description: 'Illustrative unpaid balance',
		icon: Notification01Icon,
		tone: 'neutral',
	},
] as const;

const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const weeklyVisits = [
	{ day: 'Mon', visits: 142, x: 54, y: 97, height: 80 },
	{ day: 'Tue', visits: 188, x: 124, y: 72, height: 105 },
	{ day: 'Wed', visits: 204, x: 194, y: 63, height: 114 },
	{ day: 'Thu', visits: 212, x: 264, y: 58, height: 119 },
	{ day: 'Fri', visits: 237, x: 334, y: 44, height: 133 },
	{ day: 'Sat', visits: 258, x: 404, y: 32, height: 145, peak: true },
	{ day: 'Sun', visits: 161, x: 474, y: 87, height: 90 },
];

const planPerformance = [
	{ name: 'Flex Monthly', subtitle: 'Monthly membership', members: 470, share: '49%' },
	{ name: 'Quarterly Plus', subtitle: '3-month membership', members: 266, share: '27%' },
	{ name: 'Annual Prime', subtitle: '12-month membership', members: 162, share: '17%' },
	{ name: 'Student Pass', subtitle: 'Student membership', members: 70, share: '7%' },
];

const recentPayments = [
	{
		id: 'PAY-001',
		member: 'Member #102',
		plan: 'Flex Monthly',
		date: '18 Oct 2026',
		amount: '15,000',
		method: 'Cash',
		status: 'Confirmed',
	},
	{
		id: 'PAY-002',
		member: 'Member #118',
		plan: 'Quarterly Plus',
		date: '18 Oct 2026',
		amount: '42,000',
		method: 'Mobile money',
		status: 'Pending',
	},
	{
		id: 'PAY-003',
		member: 'Member #085',
		plan: 'Annual Prime',
		date: '17 Oct 2026',
		amount: '150,000',
		method: 'Bank transfer',
		status: 'Pending',
	},
	{
		id: 'PAY-004',
		member: 'Member #206',
		plan: 'Flex Monthly',
		date: '17 Oct 2026',
		amount: '15,000',
		method: 'Cash',
		status: 'Confirmed',
	},
	{
		id: 'PAY-005',
		member: 'Member #174',
		plan: 'Student Pass',
		date: '16 Oct 2026',
		amount: '10,000',
		method: 'Cash',
		status: 'Confirmed',
	},
] as const;

export async function generateMetadata(): Promise<Metadata> {
	const { organization } = await requireOwnerPortalSession();

	return { title: `${organization.name} dashboard` };
}

export default async function DashboardPage() {
	const { session, organization } = await requireOwnerPortalSession();

	return (
		<div className={styles.page}>
			<header className={styles.pageHeader}>
				<div className={styles.headingGroup}>
					<div className={styles.eyebrow}>
						<span className={styles.eyebrowMark} aria-hidden="true" />
						GYM PERFORMANCE OVERVIEW
					</div>

					<h1>Dashboard</h1>
					<p>
						Welcome back, <strong>{session.displayName}</strong>. Here&apos;s a preview of how your
						gym analytics could look.
					</p>
				</div>

				<div className={styles.headerAside}>
					<span className={styles.period}>October 2026</span>
					<span className={styles.demoBadge}>DEMO DATA</span>
				</div>
			</header>

			<aside className={styles.demoNotice} aria-label="Demonstration data notice">
				<span className={styles.demoNoticeIcon} aria-hidden="true">
					<HugeiconsIcon icon={DashboardSquare01Icon} size={19} />
				</span>
				<div>
					<strong>Dashboard design preview</strong>
					<p>
						All member counts, payments, trends, charts and tables on this page use fictional
						example data. They are not connected to your gym records.
					</p>
				</div>
			</aside>

			<div className={styles.organizationStrip}>
				<div className={styles.organizationIdentity}>
					<div className={styles.orgAvatar} aria-hidden="true">
						{organization.name.trim().charAt(0).toUpperCase()}
					</div>
					<div>
						<span className={styles.microLabel}>CURRENT ORGANIZATION</span>
						<strong>{organization.name}</strong>
					</div>
				</div>
				<span className={styles.orgStatus} data-status={organization.status}>
					<span aria-hidden="true" />
					{organization.status === 'PENDING'
						? 'Awaiting activation'
						: organization.status.toLowerCase()}
				</span>
			</div>

			{organization.status === 'PENDING' ? (
				<aside className={styles.pendingNotice}>
					<strong>Organization activation pending.</strong> Operational features will become
					available after NEXCODE approves your gym.
				</aside>
			) : null}

			<section className={styles.metricsSection} aria-labelledby="metrics-heading">
				<div className={styles.sectionHeading}>
					<div>
						<p className={styles.sectionEyebrow}>AT A GLANCE</p>
						<h2 id="metrics-heading">Key performance indicators</h2>
					</div>
					<span className={styles.sectionQualifier}>Illustrative values</span>
				</div>

				<div className={styles.metricsGrid}>
					{metrics.map((metric) => (
						<MetricCard key={metric.label} {...metric} />
					))}
				</div>
			</section>

			<section className={styles.analyticsGrid} aria-label="Sample analytics charts">
				<article className={`${styles.panel} ${styles.revenuePanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<p className={styles.sectionEyebrow}>FINANCIAL PERFORMANCE</p>
							<h2>Revenue overview</h2>
							<p>Monthly revenue trend · May–October 2026</p>
						</div>
						<span className={styles.chartBadge}>6 months</span>
					</div>

					<div className={styles.revenueSummary}>
						<strong>
							<span>RWF</span> 130,000
						</strong>
						<span className={styles.positiveChange}>+9.4% vs September</span>
					</div>

					<figure className={styles.chartFigure}>
						<svg
							className={styles.revenueChart}
							viewBox="0 0 748 288"
							role="img"
							aria-labelledby="revenue-chart-title revenue-chart-description"
						>
							<title id="revenue-chart-title">Illustrative monthly gym revenue</title>
							<desc id="revenue-chart-description">
								Demo monthly revenue increases from 80,000 RWF in May to 130,000 RWF in October,
								with a slight dip in August.
							</desc>

							{[
								{ y: 48, label: '140k' },
								{ y: 98, label: '105k' },
								{ y: 148, label: '70k' },
								{ y: 198, label: '35k' },
								{ y: 248, label: '0' },
							].map((level) => (
								<g key={level.label}>
									<line
										className={styles.chartGridline}
										x1="56"
										x2="724"
										y1={level.y}
										y2={level.y}
									/>
									<text className={styles.chartAxisText} x="42" y={level.y + 4} textAnchor="end">
										{level.label}
									</text>
								</g>
							))}

							<path
								className={styles.revenueArea}
								d="M 70 138 L 188 123 L 306 104 L 424 113 L 542 77 L 660 60 L 660 248 L 70 248 Z"
							/>
							<path
								className={styles.revenueLine}
								d="M 70 138 L 188 123 L 306 104 L 424 113 L 542 77 L 660 60"
								pathLength={100}
							/>

							<circle className={styles.chartEndpointHalo} cx="660" cy="60" r="12" />
							<circle className={styles.chartEndpoint} cx="660" cy="60" r="5" />

							{months.map((month, index) => (
								<text
									key={month}
									className={styles.chartAxisText}
									x={70 + index * 118}
									y="278"
									textAnchor="middle"
								>
									{month}
								</text>
							))}
						</svg>

						<figcaption className={styles.chartCaption}>
							<span className={styles.legendSwatch} />
							Example revenue · RWF
						</figcaption>
					</figure>
				</article>

				<article className={`${styles.panel} ${styles.membershipPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<p className={styles.sectionEyebrow}>MEMBER INSIGHTS</p>
							<h2>Membership status</h2>
							<p>Example member distribution</p>
						</div>
					</div>

					<figure className={styles.donutFigure}>
						<svg
							className={styles.donutChart}
							viewBox="0 0 200 200"
							role="img"
							aria-labelledby="donut-title donut-description"
						>
							<title id="donut-title">Illustrative membership distribution</title>
							<desc id="donut-description">
								968 active profiles, 186 expired profiles, and 94 scheduled profiles, for a total of
								1,248.
							</desc>
							<circle className={styles.donutTrack} cx="100" cy="100" r="73" />
							<circle
								className={`${styles.donutSegment} ${styles.donutActive}`}
								cx="100"
								cy="100"
								r="73"
								pathLength={100}
							/>
							<circle
								className={`${styles.donutSegment} ${styles.donutExpired}`}
								cx="100"
								cy="100"
								r="73"
								pathLength={100}
							/>
							<circle
								className={`${styles.donutSegment} ${styles.donutScheduled}`}
								cx="100"
								cy="100"
								r="73"
								pathLength={100}
							/>
							<text className={styles.donutValue} x="100" y="99" textAnchor="middle">
								1,248
							</text>
							<text className={styles.donutLabel} x="100" y="119" textAnchor="middle">
								Total profiles
							</text>
						</svg>
					</figure>

					<div className={styles.donutLegend} aria-label="Member distribution">
						<div className={styles.legendRow}>
							<span className={`${styles.legendDot} ${styles.dotActive}`} />
							<span>Active</span>
							<strong>968</strong>
							<small>77.6%</small>
						</div>
						<div className={styles.legendRow}>
							<span className={`${styles.legendDot} ${styles.dotExpired}`} />
							<span>Expired</span>
							<strong>186</strong>
							<small>14.9%</small>
						</div>
						<div className={styles.legendRow}>
							<span className={`${styles.legendDot} ${styles.dotScheduled}`} />
							<span>Scheduled</span>
							<strong>94</strong>
							<small>7.5%</small>
						</div>
					</div>
				</article>
			</section>

			<section className={styles.secondaryGrid} aria-label="Sample attendance and plans">
				<article className={`${styles.panel} ${styles.visitsPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<p className={styles.sectionEyebrow}>FACILITY ACTIVITY</p>
							<h2>Weekly check-ins</h2>
							<p>Illustrative gym visits by weekday</p>
						</div>
						<div className={styles.inlineSummary}>
							<strong>1,402</strong>
							<span>Total visits</span>
						</div>
					</div>

					<figure className={styles.chartFigure}>
						<svg
							className={styles.visitsChart}
							viewBox="0 0 560 225"
							role="img"
							aria-labelledby="visits-title visits-description"
						>
							<title id="visits-title">Illustrative weekly gym attendance</title>
							<desc id="visits-description">
								142 visits Monday, 188 Tuesday, 204 Wednesday, 212 Thursday, 237 Friday, 258
								Saturday and 161 Sunday.
							</desc>

							<line className={styles.chartGridline} x1="35" x2="525" y1="177" y2="177" />

							{weeklyVisits.map((day) => (
								<g key={day.day}>
									<rect
										className={`${styles.visitBar} ${'peak' in day ? styles.visitBarPeak : ''}`}
										x={day.x}
										y={day.y}
										width="42"
										height={day.height}
										rx="7"
									/>
									<text className={styles.chartAxisText} x={day.x + 21} y="207" textAnchor="middle">
										{day.day}
									</text>
								</g>
							))}
						</svg>
						<figcaption className={styles.chartCaption}>
							<span className={styles.legendSwatch} />
							Example check-ins · Saturday is the busiest day
						</figcaption>
					</figure>
				</article>

				<article className={`${styles.panel} ${styles.plansPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<p className={styles.sectionEyebrow}>MEMBERSHIP PRODUCTS</p>
							<h2>Plan performance</h2>
							<p>Example active enrollments by plan</p>
						</div>
						<Link href={routes.memberships} className={styles.panelLink}>
							View plans
							<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
						</Link>
					</div>

					<div className={styles.tableScroll}>
						<table className={styles.dataTable}>
							<caption className={styles.srOnly}>
								Illustrative active membership enrollments by plan
							</caption>
							<thead>
								<tr>
									<th scope="col">Membership plan</th>
									<th scope="col" className={styles.numericCell}>
										Members
									</th>
									<th scope="col" className={styles.numericCell}>
										Share
									</th>
								</tr>
							</thead>
							<tbody>
								{planPerformance.map((plan) => (
									<tr key={plan.name}>
										<td>
											<div className={styles.tablePrimary}>{plan.name}</div>
											<div className={styles.tableSecondary}>{plan.subtitle}</div>
										</td>
										<td className={styles.numericCell}>{plan.members}</td>
										<td className={styles.numericCell}>
											<span className={styles.sharePill}>{plan.share}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</article>
			</section>

			<section className={styles.paymentsSection} aria-labelledby="payments-heading">
				<div className={styles.sectionHeading}>
					<div>
						<p className={styles.sectionEyebrow}>FINANCIAL ACTIVITY</p>
						<h2 id="payments-heading">Recent payments</h2>
						<p className={styles.sectionDescription}>
							Illustrative transaction records shown for layout preview.
						</p>
					</div>
					<Link href={routes.payments} className={styles.sectionLink}>
						Open payments
						<HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
					</Link>
				</div>

				<div className={`${styles.panel} ${styles.paymentsPanel}`}>
					<div className={styles.tableScroll}>
						<table className={styles.dataTable}>
							<caption className={styles.srOnly}>
								Example payments, not actual financial records
							</caption>
							<thead>
								<tr>
									<th scope="col">Reference</th>
									<th scope="col">Member</th>
									<th scope="col">Membership</th>
									<th scope="col">Date</th>
									<th scope="col">Method</th>
									<th scope="col" className={styles.numericCell}>
										Amount
									</th>
									<th scope="col">Status</th>
								</tr>
							</thead>
							<tbody>
								{recentPayments.map((payment) => (
									<tr key={payment.id}>
										<td>
											<span className={styles.paymentReference}>{payment.id}</span>
										</td>
										<td>
											<strong className={styles.paymentMember}>{payment.member}</strong>
										</td>
										<td>{payment.plan}</td>
										<td className={styles.mutedCell}>{payment.date}</td>
										<td className={styles.mutedCell}>{payment.method}</td>
										<td className={`${styles.numericCell} ${styles.amountCell}`}>
											{payment.amount} <span>RWF</span>
										</td>
										<td>
											<span className={styles.paymentStatus} data-status={payment.status}>
												<span aria-hidden="true" />
												{payment.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className={styles.tableFooter}>
						<span>Showing 5 fictional transactions</span>
						<Link href={routes.payments}>
							Go to payment ledger
							<HugeiconsIcon icon={ArrowRight01Icon} size={15} aria-hidden="true" />
						</Link>
					</div>
				</div>
			</section>

			<nav className={styles.quickLinks} aria-label="Management shortcuts">
				<QuickLink
					icon={UserGroupIcon}
					title="Manage members"
					description="Open member profiles and registrations"
					href={routes.members}
				/>
				<QuickLink
					icon={PackageIcon}
					title="Membership plans"
					description="Review your gym membership products"
					href={routes.memberships}
				/>
				<QuickLink
					icon={ChartLineData01Icon}
					title="View reports"
					description="Explore the reporting workspace"
					href={routes.report}
				/>
			</nav>

			<footer className={styles.dashboardFooter}>
				<span>Gym management dashboard</span>
				<span>Static design preview · NEXCODE</span>
			</footer>
		</div>
	);
}

function MetricCard({
	label,
	value,
	unit,
	change,
	description,
	icon,
	tone,
}: {
	readonly label: string;
	readonly value: string;
	readonly unit?: string;
	readonly change: string;
	readonly description: string;
	readonly icon: IconSvgElement;
	readonly tone: 'primary' | 'neutral';
}) {
	return (
		<article className={styles.metricCard} data-tone={tone}>
			<div className={styles.metricTop}>
				<span className={styles.metricIcon}>
					<HugeiconsIcon icon={icon} size={21} strokeWidth={1.7} aria-hidden="true" />
				</span>
				<span className={styles.metricTag}>SAMPLE</span>
			</div>

			<div>
				<h3 className={styles.metricLabel}>{label}</h3>
				<div className={styles.metricValue}>
					{unit ? <span className={styles.metricUnit}>{unit}</span> : null}
					<strong>{value}</strong>
				</div>
			</div>

			<div className={styles.metricBottom}>
				<span className={styles.metricChange}>{change}</span>
				<span className={styles.metricDescription}>{description}</span>
			</div>
		</article>
	);
}

function QuickLink({
	icon,
	title,
	description,
	href,
}: {
	readonly icon: IconSvgElement;
	readonly title: string;
	readonly description: string;
	readonly href: string;
}) {
	return (
		<Link href={href} className={styles.quickLink}>
			<span className={styles.quickLinkIcon}>
				<HugeiconsIcon icon={icon} size={20} strokeWidth={1.7} aria-hidden="true" />
			</span>
			<span className={styles.quickLinkText}>
				<strong>{title}</strong>
				<small>{description}</small>
			</span>
			<HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
		</Link>
	);
}
