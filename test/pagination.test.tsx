// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Pagination } from '@/components/shared/pagination';

afterEach(cleanup);

describe('shared pagination', () => {
	it('stays hidden until another page exists', () => {
		render(
			<Pagination label="Members" page={1} loadedPages={1} hasNext={false} onPageChange={vi.fn()} />,
		);
		expect(screen.queryByRole('navigation', { name: 'Members pages' })).toBeNull();
	});

	it('offers the next cursor page and announces the selected page', () => {
		const onPageChange = vi.fn();
		render(
			<Pagination label="Members" page={1} loadedPages={1} hasNext onPageChange={onPageChange} />,
		);
		expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
		fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
		expect(onPageChange).toHaveBeenCalledWith(2);
		expect(screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled')).toBe(true);
	});

	it('prevents navigation while a page is loading', () => {
		const onPageChange = vi.fn();
		render(
			<Pagination label="Payments" page={2} loadedPages={2} hasNext pending onPageChange={onPageChange} />,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
		expect(onPageChange).not.toHaveBeenCalled();
	});
});
