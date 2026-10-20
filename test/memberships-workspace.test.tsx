// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MembershipsWorkspace } from '@/components/memberships/memberships-workspace';
import type { MembershipPlan } from '@/lib/contracts';

const plans: MembershipPlan[] = [
	{
		id: '11111111-1111-4111-8111-111111111111',
		name: 'Premium',
		price: 50_000,
		currency: 'RWF',
		description: 'Personal training and pool access',
		status: 'ACTIVE',
		createdAt: '2030-01-01T08:00:00.000Z',
		updatedAt: '2030-01-01T08:00:00.000Z',
		archivedAt: null,
	},
	{
		id: '22222222-2222-4222-8222-222222222222',
		name: 'Basic',
		price: 20_000,
		currency: 'RWF',
		description: 'Gym floor access',
		status: 'ACTIVE',
		createdAt: '2030-01-01T08:00:00.000Z',
		updatedAt: '2030-01-01T08:00:00.000Z',
		archivedAt: null,
	},
	{
		id: '33333333-3333-4333-8333-333333333333',
		name: 'Legacy',
		price: 10_000,
		currency: 'RWF',
		description: null,
		status: 'ARCHIVED',
		createdAt: '2030-01-01T08:00:00.000Z',
		updatedAt: '2030-01-02T08:00:00.000Z',
		archivedAt: '2030-01-02T08:00:00.000Z',
	},
];

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('membership pricing workspace', () => {
	it('orders cards by ascending price and keeps descriptions out of cards', () => {
		render(<MembershipsWorkspace initialItems={plans.slice(1, 2)} initialNextCursor={null} />);

		const cards = screen.getAllByRole('article');
		expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual(['Basic']);
		expect(screen.queryByText('Gym floor access')).toBeNull();
		expect(screen.queryByText('Personal training and pool access')).toBeNull();
		expect(screen.getByRole('button', { name: 'View Basic details' })).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'Legacy' })).toBeNull();
	});

	it('searches loaded plans while requesting status and ordering from the backend', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [plans[0]], nextCursor: null }));
		fetchMock.mockResolvedValueOnce(Response.json({ items: [plans[2]], nextCursor: null }));
		fetchMock.mockResolvedValueOnce(Response.json({ items: [plans[1], plans[0]], nextCursor: null }));
		render(<MembershipsWorkspace initialItems={[plans[1]!, plans[0]!]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Order: Price: low to high' }));
		fireEvent.click(screen.getByRole('button', { name: 'Price: high to low' }));
		await waitFor(() => expect(String(fetchMock.mock.calls[0]?.[0])).toContain('order=PRICE_DESC'));
		expect(await screen.findByRole('heading', { name: 'Premium' })).toBeTruthy();

		fireEvent.click(screen.getByRole('button', { name: 'Status: Active' }));
		fireEvent.click(screen.getByRole('button', { name: /^Archived$/ }));
		expect(await screen.findByRole('heading', { name: 'Legacy' })).toBeTruthy();
		expect(String(fetchMock.mock.calls[1]?.[0])).toContain('status=ARCHIVED');
		expect(screen.queryByRole('button', { name: 'Edit Legacy' })).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Search memberships' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'not a plan' } });
		expect(await screen.findByRole('heading', { name: 'No matching memberships' })).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		fireEvent.click(screen.getByRole('button', { name: 'Show active' }));
		await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
		expect(screen.queryByRole('heading', { name: 'Legacy' })).toBeNull();
	});

	it('loads archived plans even when the active page has one plan', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [plans[2]], nextCursor: null }));
		render(
			<MembershipsWorkspace
				initialItems={[plans[1]!]}
				initialNextCursor={null}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Status: Active' }));
		fireEvent.click(screen.getByRole('button', { name: /^Archived$/ }));
		expect(await screen.findByRole('heading', { name: 'Legacy' })).toBeTruthy();
	});
});
