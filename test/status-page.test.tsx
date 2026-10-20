// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { StatusPage } from '@/components/shared/status-page';

afterEach(() => cleanup());

describe('global status pages', () => {
	it.each([
		[401, 'Sign in required', '/login'],
		[404, 'Page not found', '/dashboard'],
		[429, 'Too many requests', '/dashboard'],
		[503, 'Service temporarily unavailable', '/dashboard'],
	] as const)('renders %i with a safe recovery destination', (status, title, href) => {
		render(<StatusPage status={status} />);

		expect(screen.getByRole('heading', { name: title })).toBeTruthy();
		expect(screen.getByRole('link').getAttribute('href')).toBe(href);
	});

	it('offers sign-out instead of looping a denied account back to the dashboard', () => {
		render(<StatusPage status={403} />);

		expect(screen.getByRole('heading', { name: 'Access not available' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
		expect(screen.queryByRole('link')).toBeNull();
	});

	it('lets the user retry an unexpected failure without displaying error details', () => {
		const retry = vi.fn();
		render(<StatusPage status={500} onRetry={retry} />);

		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(retry).toHaveBeenCalledOnce();
		expect(screen.getByText('ERROR 500')).toBeTruthy();
	});
});
