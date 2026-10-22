// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RevenueLineChart } from '@/components/dashboard/revenue-line-chart';

afterEach(() => cleanup());

describe('dashboard revenue line chart', () => {
	it('plots server values as a line and exposes exact values accessibly', () => {
		const { container } = render(
			<RevenueLineChart
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
		const path = container.querySelector('path');
		expect(path?.getAttribute('d')).toMatch(/^M .+ L .+ L /u);
		expect(path?.getAttribute('d')).not.toMatch(/NaN|Infinity/u);
		expect(container.querySelectorAll('rect')).toHaveLength(0);
	});

	it('keeps an all-zero range and a single bucket finite', () => {
		const { container } = render(
			<RevenueLineChart
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
		expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M /u);
		expect(container.querySelector('path')?.getAttribute('d')).not.toMatch(/NaN|Infinity/u);
	});
});
