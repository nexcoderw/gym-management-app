// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ResultsLoadingState } from '@/components/shared/results-loading-state';

afterEach(cleanup);

describe('shared results loading state', () => {
	it('announces a search with only its essential status text', () => {
		render(<ResultsLoadingState subject="members" searching />);

		const status = screen.getByRole('status');
		expect(screen.getByRole('heading', { name: 'Searching members' })).toBeTruthy();
		expect(status.textContent).toBe('Searching members');
		expect(status.querySelector('[aria-hidden="true"]')).toBeTruthy();
	});

	it('uses neutral loading copy for a filter or page change', () => {
		render(<ResultsLoadingState subject="payments" />);

		expect(screen.getByRole('heading', { name: 'Loading payments' })).toBeTruthy();
		expect(screen.getByRole('status').textContent).toBe('Loading payments');
	});
});
