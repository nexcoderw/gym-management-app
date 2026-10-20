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

	it('shows both ends and jumps directly to the first or last known page', () => {
		const onPageChange = vi.fn();
		const { rerender } = render(
			<Pagination
				label="Members"
				page={1}
				totalPages={17}
				totalItems={321}
				pageSize={20}
				onPageChange={onPageChange}
			/>,
		);
		expect(screen.getByRole('button', { name: 'First page' }).getAttribute('aria-current')).toBe(
			'page',
		);
		expect(screen.getByRole('button', { name: 'Page 3' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Page 5' })).toBeTruthy();
		expect(screen.getByText('Showing 20 of 321 results')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
		expect(onPageChange).toHaveBeenLastCalledWith(17);

		rerender(
			<Pagination
				label="Members"
				page={17}
				totalPages={17}
				totalItems={321}
				pageSize={20}
				onPageChange={onPageChange}
			/>,
		);
		expect(screen.getByText('Showing 321 of 321 results')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'First page' }));
		expect(onPageChange).toHaveBeenLastCalledWith(1);
	});

	it('offers a middle-page jump through a gap button', () => {
		const onPageChange = vi.fn();
		render(<Pagination label="Members" page={9} totalPages={33} onPageChange={onPageChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Jump to page 3' }));
		expect(onPageChange).toHaveBeenCalledWith(3);
		expect(screen.getByRole('button', { name: 'Next page' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy();
	});

	it('matches the five-page reference window without losing the last-page jump', () => {
		const onPageChange = vi.fn();
		render(
			<Pagination
				label="Members"
				page={5}
				totalPages={99}
				totalItems={1_980}
				pageSize={20}
				onPageChange={onPageChange}
			/>,
		);
		for (const number of [2, 3, 4, 5]) {
			expect(screen.getByRole('button', { name: `Page ${number}` })).toBeTruthy();
		}
		expect(screen.getByRole('button', { name: 'First page' }).textContent).toBe('1');
		expect(screen.getByRole('button', { name: 'Last page' }).textContent).toBe('99');
		expect(screen.getByText('Showing 100 of 1,980 results')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
		expect(onPageChange).toHaveBeenCalledWith(99);
	});
});
