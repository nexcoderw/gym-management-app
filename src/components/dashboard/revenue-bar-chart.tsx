import type { ReactElement } from 'react';

import type { DashboardAnalytics } from '@/lib/contracts';

import styles from './revenue-bar-chart.module.css';

interface RevenueBarChartProps {
	readonly points: DashboardAnalytics['revenueSeries'];
}

const amountFormatter = new Intl.NumberFormat('en-RW');
const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC',
});

function labelDate(value: string): string {
	return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function RevenueBarChart({ points }: RevenueBarChartProps): ReactElement {
	const maximum = points.reduce((largest, point) => {
		const amount = BigInt(point.netRwf);
		return amount > largest ? amount : largest;
	}, BigInt(0));
	const tickIndices = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

	return (
		<figure className={styles.figure}>
			<div className={styles.scrollArea}>
				<div
					className={styles.plot}
					role="img"
					aria-label="Net revenue trend across the selected dates"
				>
					<div className={styles.scale} aria-hidden="true">
						<span>{amountFormatter.format(maximum)}</span>
						<span>0</span>
					</div>
					<div className={styles.columns} aria-hidden="true">
						{points.map((point, index) => {
							const amount = BigInt(point.netRwf);
							const percentage =
								maximum === BigInt(0) ? 0 : Number((amount * BigInt(10000)) / maximum) / 100;
							return (
								<div className={styles.column} key={point.fromDate}>
									<div className={styles.barTrack}>
										<div className={styles.bar} style={{ height: `${percentage}%` }} />
									</div>
									<span className={styles.tick}>
										{tickIndices.has(index) ? labelDate(point.fromDate) : '\u00a0'}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
			<figcaption className={styles.caption}>
				Net revenue in RWF · {points.length} {points.length === 1 ? 'period' : 'periods'}
			</figcaption>
			<ol className={styles.dataList} aria-label="Revenue data points">
				{points.map((point) => (
					<li key={point.fromDate}>
						{labelDate(point.fromDate)}–{labelDate(point.toDate)}: RWF{' '}
						{amountFormatter.format(BigInt(point.netRwf))}
					</li>
				))}
			</ol>
		</figure>
	);
}
