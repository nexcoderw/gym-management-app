// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RevenueBarChart } from '@/components/dashboard/revenue-bar-chart';

afterEach(() => cleanup());

describe('dashboard revenue chart', () => {
	it('renders revenue bars and exposes exact values accessibly', () => {
		const { container } = render(
			<RevenueBarChart
				points={[
					{
						fromDate: '2026-10-01',
						toDate: '2026-10-01',
						grossRwf: '0',
						refundedRwf: '0',
						netRwf: '0',
					},
					{
						fromDate: '2026-10-02',
						toDate: '2026-10-02',
						grossRwf: '15000',
						refundedRwf: '0',
						netRwf: '15000',
					},
					{
						fromDate: '2026-10-03',
						toDate: '2026-10-03',
						grossRwf: '10000',
						refundedRwf: '0',
						netRwf: '10000',
					},
				]}
			/>,
		);

		expect(
			screen.getByRole('img', { name: 'Net revenue trend across the selected dates' }),
		).toBeTruthy();
		expect(screen.getByRole('list', { name: 'Revenue data points' }).textContent).toContain(
			'15,000',
		);
		const bars = container.querySelectorAll('[style*="height"]');
		expect(bars).toHaveLength(3);
		expect(bars[0]?.getAttribute('style')).toContain('0%');
		expect(bars[1]?.getAttribute('style')).toContain('100%');
		expect(bars[2]?.getAttribute('style')).toContain('66.66%');
		expect(container.querySelector('svg')).toBeNull();
	});

	it('keeps all-zero and single-bucket periods finite', () => {
		const { container } = render(
			<RevenueBarChart
				points={[
					{
						fromDate: '2026-10-01',
						toDate: '2026-10-01',
						grossRwf: '0',
						refundedRwf: '0',
						netRwf: '0',
					},
				]}
			/>,
		);

		expect(container.querySelector('[style*="height"]')?.getAttribute('style')).toContain('0%');
		expect(container.textContent).not.toMatch(/NaN|Infinity/u);
	});
});
