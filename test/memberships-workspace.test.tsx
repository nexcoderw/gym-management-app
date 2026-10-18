// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

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

afterEach(cleanup);

describe('membership pricing workspace', () => {
	it('orders cards by ascending price and keeps descriptions out of cards', () => {
		render(<MembershipsWorkspace initialItems={plans} initialNextCursor={null} />);

		const cards = screen.getAllByRole('article');
		expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
			'Basic',
			'Premium',
		]);
		expect(screen.queryByText('Gym floor access')).toBeNull();
		expect(screen.queryByText('Personal training and pool access')).toBeNull();
		expect(screen.getByRole('button', { name: 'View Premium details' })).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'Legacy' })).toBeNull();
	});

	it('combines search, status filtering and descending ordering', () => {
		render(<MembershipsWorkspace initialItems={plans} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Order: Price: low to high' }));
		fireEvent.click(screen.getByRole('button', { name: 'Price: high to low' }));
		expect(
			screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent),
		).toEqual(['Premium', 'Basic']);

		fireEvent.click(screen.getByRole('button', { name: 'Status: Active' }));
		fireEvent.click(screen.getByRole('button', { name: 'Archived', exact: true }));
		expect(screen.getAllByRole('article')).toHaveLength(1);
		expect(screen.getByRole('heading', { name: 'Legacy' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Edit Legacy' })).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Search memberships' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'not a plan' } });
		expect(screen.queryByRole('article')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Show active' }));
		expect(screen.getAllByRole('article')).toHaveLength(2);
		expect(screen.queryByRole('heading', { name: 'Legacy' })).toBeNull();
	});

	it('allows archived filtering when the only plan is archived', () => {
		render(
			<MembershipsWorkspace
				initialItems={plans.filter((plan) => plan.status === 'ARCHIVED')}
				initialNextCursor={null}
			/>,
		);

		expect(screen.queryByRole('article')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Status: Active' }));
		fireEvent.click(screen.getByRole('button', { name: 'Archived', exact: true }));
		expect(screen.getByRole('heading', { name: 'Legacy' })).toBeTruthy();
	});
});
