import {
	ArrowRight01Icon,
	Calendar03Icon,
	ChartLineData01Icon,
	CreditCardIcon,
	Mail01Icon,
	Notification01Icon,
	Tick02Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '@/constants/routes';
import { requireOwnerPortalSession } from '@/lib/server/session';

import styles from './page.module.css';

export const metadata: Metadata = { title: 'Reminders' };

// Fictional UI examples. These are not actual scheduled or sent messages.
const statistics = [
	{
		label: 'Planned reminders',
		value: '84',
		detail: 'Example upcoming notifications',
		icon: Calendar03Icon,
	},
	{
		label: 'Delivered',
		value: '312',
		detail: 'Illustrative delivery count',
		icon: Tick02Icon,
	},
	{
		label: 'Failed',
		value: '11',
		detail: 'Example delivery failures',
		icon: Notification01Icon,
	},
	{
		label: 'Delivery rate',
		value: '96.6%',
		detail: '312 of 323 sample attempts',
		icon: ChartLineData01Icon,
	},
] as const;

const deliveryChart = [
	{ day: 'Mon', count: 39 },
	{ day: 'Tue', count: 44 },
	{ day: 'Wed', count: 50 },
	{ day: 'Thu', count: 47 },
	{ day: 'Fri', count: 43 },
	{ day: 'Sat', count: 54 },
	{ day: 'Sun', count: 46 },
] as const;

const upcomingReminders = [
	{
		name: 'Aline Uwase',
		initials: 'AU',
		phone: '+250 788 123 456',
		type: 'Membership renewal',
		date: '19 Oct 2026',
		channel: 'SMS',
		status: 'Planned',
	},
	{
		name: 'Eric Niyonsenga',
		initials: 'EN',
		phone: '+250 783 456 781',
		type: 'Outstanding balance',
		date: '20 Oct 2026',
		channel: 'SMS',
		status: 'Needs review',
	},
	{
		name: 'Claudine Mukamana',
		initials: 'CM',
		phone: '+250 722 310 849',
		type: 'Membership expiry',
		date: '21 Oct 2026',
		channel: 'Email',
		status: 'Planned',
	},
	{
		name: 'Jean Claude Habimana',
		initials: 'JH',
		phone: '+250 789 665 420',
		type: 'Payment reminder',
		date: '22 Oct 2026',
		channel: 'SMS',
		status: 'Planned',
	},
	{
		name: 'Sandrine Uwamahoro',
		initials: 'SU',
		phone: '+250 781 234 908',
		type: 'Membership renewal',
		date: '23 Oct 2026',
		channel: 'Email',
		status: 'Needs review',
	},
] as const;

const recentActivity = [
	{ title: 'Renewal message delivered', person: 'Aline Uwase', time: '10:42 AM', tone: 'success' },
	{
		title: 'Payment reminder delivered',
		person: 'Pacifique Nsengiyumva',
		time: '09:18 AM',
		tone: 'success',
	},
	{
		title: 'Delivery needs attention',
		person: 'Eric Niyonsenga',
		time: 'Yesterday',
		tone: 'warning',
	},
] as const;

export default async function RemindersPage() {
	const { organization } = await requireOwnerPortalSession();

	return (
		<div className={styles.page}>
			<header className={styles.pageHeader}>
				<div className={styles.heading}>
					<span className={styles.eyebrow}>MEMBER COMMUNICATIONS</span>
					<h1>Reminders</h1>
					<p>
						Preview how membership renewals, payment follow-ups and message delivery could be
						monitored for {organization.name}.
					</p>
				</div>
				<div className={styles.headerMeta}>
					<span className={styles.period}>October 2026</span>
					<span className={styles.demoTag}>DEMO DATA</span>
				</div>
			</header>

			<aside className={styles.demoNotice}>
				<span className={styles.noticeIcon} aria-hidden="true">
					<HugeiconsIcon icon={Notification01Icon} size={20} />
				</span>
				<div>
					<strong>Communication dashboard preview</strong>
					<p>
						All reminders, recipients, phone numbers, statuses and delivery results on this page are
						fictional. No messages have been scheduled or sent by this interface.
					</p>
				</div>
			</aside>

			<section className={styles.overview} aria-labelledby="reminder-overview">
				<div className={styles.sectionHeading}>
					<div>
						<span className={styles.eyebrow}>OVERVIEW</span>
						<h2 id="reminder-overview">Reminder performance</h2>
					</div>
					<span className={styles.mutedLabel}>Illustrative values</span>
				</div>

				<div className={styles.metricsGrid}>
					{statistics.map((statistic) => (
						<article className={styles.metric} key={statistic.label}>
							<div className={styles.metricTop}>
								<span className={styles.metricIcon}>
									<HugeiconsIcon
										icon={statistic.icon}
										size={21}
										strokeWidth={1.7}
										aria-hidden="true"
									/>
								</span>
								<span className={styles.sampleLabel}>SAMPLE</span>
							</div>
							<div>
								<p className={styles.metricLabel}>{statistic.label}</p>
								<strong className={styles.metricValue}>{statistic.value}</strong>
							</div>
							<p className={styles.metricDetail}>{statistic.detail}</p>
						</article>
					))}
				</div>
			</section>

			<section className={styles.analyticsGrid} aria-label="Example delivery analytics">
				<article className={`${styles.panel} ${styles.activityPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>DELIVERY ANALYTICS</span>
							<h2>Weekly message activity</h2>
							<p>Sample delivery attempts · 12–18 October 2026</p>
						</div>
						<span className={styles.panelBadge}>Last 7 days</span>
					</div>

					<div className={styles.chartHeadline}>
						<strong>323</strong>
						<span>Example delivery attempts</span>
					</div>

					<figure className={styles.chartFigure}>
						<svg
							className={styles.barChart}
							viewBox="0 0 560 254"
							role="img"
							aria-labelledby="reminder-chart-title reminder-chart-desc"
						>
							<title id="reminder-chart-title">Example weekly reminder activity</title>
							<desc id="reminder-chart-desc">
								39 attempts Monday, 44 Tuesday, 50 Wednesday, 47 Thursday, 43 Friday, 54 Saturday
								and 46 Sunday.
							</desc>
							{[60, 40, 20, 0].map((value) => {
								const y = 208 - value * 2;
								return (
									<g key={value}>
										<line x1="46" x2="538" y1={y} y2={y} className={styles.gridLine} />
										<text x="36" y={y + 4} textAnchor="end" className={styles.axisText}>
											{value}
										</text>
									</g>
								);
							})}
							{deliveryChart.map((entry, index) => (
								<g key={entry.day} className={styles.chartColumn}>
									<rect
										x={67 + index * 68}
										y={208 - entry.count * 2}
										width="35"
										height={entry.count * 2}
										rx="6"
										className={styles.bar}
										data-peak={entry.day === 'Sat'}
									/>
									<text
										x={84.5 + index * 68}
										y={196 - entry.count * 2}
										textAnchor="middle"
										className={styles.valueText}
									>
										{entry.count}
									</text>
									<text
										x={84.5 + index * 68}
										y="238"
										textAnchor="middle"
										className={styles.axisText}
									>
										{entry.day}
									</text>
								</g>
							))}
						</svg>
						<figcaption className={styles.chartCaption}>
							<span className={styles.legendMark} />
							Example delivery attempts per day
						</figcaption>
					</figure>
				</article>

				<article className={`${styles.panel} ${styles.deliveryPanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>DELIVERY HEALTH</span>
							<h2>Delivery summary</h2>
							<p>Example completed message attempts</p>
						</div>
					</div>

					<div className={styles.deliveryScore}>
						<div className={styles.deliveryRing}>
							<svg
								viewBox="0 0 180 180"
								role="img"
								aria-labelledby="delivery-ring-title delivery-ring-desc"
							>
								<title id="delivery-ring-title">Example 96.6% delivery success rate</title>
								<desc id="delivery-ring-desc">
									312 of 323 message attempts succeeded. Eleven failed.
								</desc>
								<circle className={styles.ringTrack} cx="90" cy="90" r="69" />
								<circle className={styles.ringProgress} cx="90" cy="90" r="69" pathLength={100} />
								<text x="90" y="86" textAnchor="middle" className={styles.ringValue}>
									96.6%
								</text>
								<text x="90" y="108" textAnchor="middle" className={styles.ringLabel}>
									Delivered
								</text>
							</svg>
						</div>
					</div>

					<div className={styles.deliveryBreakdown}>
						<div className={styles.breakdownRow}>
							<span className={styles.dot} data-tone="success" />
							<span>Delivered</span>
							<strong>312</strong>
						</div>
						<div className={styles.breakdownRow}>
							<span className={styles.dot} data-tone="danger" />
							<span>Failed</span>
							<strong>11</strong>
						</div>
						<div className={styles.breakdownRow}>
							<span className={styles.dot} data-tone="pending" />
							<span>Planned separately</span>
							<strong>84</strong>
						</div>
					</div>

					<p className={styles.panelNote}>
						Delivery figures describe fictional events, not your live notification service.
					</p>
				</article>
			</section>

			<section className={styles.scheduleSection} aria-labelledby="schedule-heading">
				<div className={styles.sectionHeading}>
					<div>
						<span className={styles.eyebrow}>UPCOMING COMMUNICATIONS</span>
						<h2 id="schedule-heading">Reminder schedule preview</h2>
						<p className={styles.sectionDescription}>
							Example recipients and upcoming dates in Kigali local time.
						</p>
					</div>
					<Link href={routes.members} className={styles.textLink}>
						View members
						<HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
					</Link>
				</div>

				<div className={`${styles.panel} ${styles.tablePanel}`}>
					<div className={styles.tableScroll}>
						<table className={styles.table}>
							<caption className={styles.visuallyHidden}>
								Fictional reminders; no messages are scheduled
							</caption>
							<thead>
								<tr>
									<th scope="col">Recipient</th>
									<th scope="col">Reminder</th>
									<th scope="col">Example date</th>
									<th scope="col">Channel</th>
									<th scope="col">Preview status</th>
								</tr>
							</thead>
							<tbody>
								{upcomingReminders.map((reminder) => (
									<tr key={reminder.phone}>
										<td>
											<div className={styles.recipient}>
												<span className={styles.avatar} aria-hidden="true">
													{reminder.initials}
												</span>
												<div>
													<strong>{reminder.name}</strong>
													<small>{reminder.phone}</small>
												</div>
											</div>
										</td>
										<td>{reminder.type}</td>
										<td className={styles.tableMuted}>{reminder.date}</td>
										<td>
											<span className={styles.channelBadge}>{reminder.channel}</span>
										</td>
										<td>
											<span className={styles.statusBadge} data-status={reminder.status}>
												<span aria-hidden="true" />
												{reminder.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className={styles.tableFooter}>
						<span>5 fictional recipients · no real sending activity</span>
						<Link href={routes.memberships}>Review memberships</Link>
					</div>
				</div>
			</section>

			<section className={styles.bottomGrid} aria-label="Communication examples">
				<article className={`${styles.panel} ${styles.activityFeed}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>ACTIVITY FEED</span>
							<h2>Recent activity preview</h2>
							<p>Example delivery events</p>
						</div>
					</div>

					<ol className={styles.timeline}>
						{recentActivity.map((item) => (
							<li key={item.title}>
								<span className={styles.timelineDot} data-tone={item.tone} />
								<div>
									<strong>{item.title}</strong>
									<span>{item.person}</span>
								</div>
								<time>{item.time}</time>
							</li>
						))}
					</ol>
				</article>

				<article className={`${styles.panel} ${styles.templatePanel}`}>
					<div className={styles.panelHeader}>
						<div>
							<span className={styles.eyebrow}>MESSAGE DESIGN</span>
							<h2>Reminder message preview</h2>
							<p>Example SMS template · not connected to a sender</p>
						</div>
						<span className={styles.channelBadge}>SMS</span>
					</div>

					<div className={styles.messagePreview}>
						<div className={styles.messageMeta}>
							<HugeiconsIcon icon={Mail01Icon} size={17} aria-hidden="true" />
							<span>Preview only</span>
						</div>
						<blockquote>
							Muraho Aline Uwase! This is a friendly reminder from your gym. Your membership is due
							for renewal on 19 October 2026. Please contact reception for assistance. Murakoze!
						</blockquote>
						<p>No message will be sent.</p>
					</div>
				</article>
			</section>

			<nav className={styles.shortcuts} aria-label="Related management pages">
				<Shortcut
					icon={UserGroupIcon}
					title="Members"
					description="Review member profiles"
					href={routes.members}
				/>
				<Shortcut
					icon={CreditCardIcon}
					title="Payments"
					description="Open the payment ledger"
					href={routes.payments}
				/>
			</nav>

			<footer className={styles.footer}>
				<span>Reminder management preview</span>
				<span>Static design · NEXCODE</span>
			</footer>
		</div>
	);
}

function Shortcut({
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
		<Link className={styles.shortcut} href={href}>
			<span className={styles.shortcutIcon}>
				<HugeiconsIcon icon={icon} size={21} aria-hidden="true" />
			</span>
			<span className={styles.shortcutText}>
				<strong>{title}</strong>
				<small>{description}</small>
			</span>
			<HugeiconsIcon icon={ArrowRight01Icon} size={19} aria-hidden="true" />
		</Link>
	);
}
