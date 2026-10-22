import type { ReactElement } from 'react';

import type { DashboardAnalytics } from '@/lib/contracts';

import styles from './revenue-line-chart.module.css';

interface RevenueLineChartProps {
	readonly points: DashboardAnalytics['revenueSeries'];
}

const WIDTH = 800;
const HEIGHT = 240;
const LEFT = 52;
const RIGHT = 20;
const TOP = 20;
const BOTTOM = 42;
const plotWidth = WIDTH - LEFT - RIGHT;
const plotHeight = HEIGHT - TOP - BOTTOM;
const amountFormatter = new Intl.NumberFormat('en-RW');
const dateFormatter = new Intl.DateTimeFormat('en-RW', {
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC',
});

function labelDate(value: string): string {
	return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function RevenueLineChart({ points }: RevenueLineChartProps): ReactElement {
	const maximum = points.reduce((largest, point) => {
		const amount = BigInt(point.netRwf);
		return amount > largest ? amount : largest;
	}, BigInt(0));
	const plotted = points.map((point, index) => ({
		point,
		x: LEFT + (points.length === 1 ? plotWidth / 2 : (index * plotWidth) / (points.length - 1)),
		y:
			TOP +
			plotHeight -
			(maximum === BigInt(0) ? 0 : Number((BigInt(point.netRwf) * BigInt(plotHeight)) / maximum)),
	}));
	const path = plotted
		.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
		.join(' ');
	const tickIndices = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

	return (
		<figure className={styles.figure}>
			<svg
				className={styles.chart}
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				role="img"
				aria-label="Net revenue trend across the selected dates"
			>
				{[0, 0.5, 1].map((fraction) => {
					const y = TOP + plotHeight * fraction;
					return (
						<line
							key={fraction}
							className={styles.guide}
							x1={LEFT}
							x2={WIDTH - RIGHT}
							y1={y}
							y2={y}
						/>
					);
				})}
				{maximum > BigInt(0) ? (
					<text className={styles.axisValue} x={LEFT - 10} y={TOP + 4} textAnchor="end">
						{amountFormatter.format(maximum)}
					</text>
				) : null}
				<text className={styles.axisValue} x={LEFT - 10} y={TOP + plotHeight + 4} textAnchor="end">
					0
				</text>
				<path className={styles.line} d={path} pathLength={1} />
				{plotted.map(({ point, x, y }, index) => (
					<g key={point.fromDate}>
						{tickIndices.has(index) ? (
							<>
								<circle className={styles.point} cx={x} cy={y} r={4} />
								<text className={styles.axisDate} x={x} y={HEIGHT - 12} textAnchor="middle">
									{labelDate(point.fromDate)}
								</text>
							</>
						) : null}
					</g>
				))}
			</svg>
			<figcaption className={styles.caption}>
				Net revenue in RWF. {points.length} {points.length === 1 ? 'period' : 'periods'} shown.
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
