// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MembersWorkspace } from '@/components/members/members-workspace';
import type { Member } from '@/lib/contracts';

vi.mock('@/components/shared/dialog', () => ({
	Dialog: ({
		title,
		children,
		onClose,
	}: {
		title: string;
		children: ReactNode;
		onClose: () => void;
	}) => (
		<section role="dialog" aria-label={title}>
			{children}
			<button type="button" onClick={onClose}>
				Close details
			</button>
		</section>
	),
}));

const activeMember: Member = {
	id: '11111111-1111-4111-8111-111111111111',
	name: 'Example Active Member',
	phoneNumber: '+250 700 000 001',
	email: null,
	status: 'ACTIVE',
	createdAt: '2030-01-01T08:00:00.000Z',
	updatedAt: '2030-01-01T08:00:00.000Z',
	archivedAt: null,
};

const secondMember: Member = {
	...activeMember,
	id: '33333333-3333-4333-8333-333333333333',
	name: 'Zoe Member',
	phoneNumber: '+250 700 000 002',
	email: 'zoe@example.com',
	createdAt: '2030-01-03T08:00:00.000Z',
	updatedAt: '2030-01-03T08:00:00.000Z',
};

const archivedMember: Member = {
	...activeMember,
	id: '22222222-2222-4222-8222-222222222222',
	name: 'Example Archived Member',
	status: 'ARCHIVED',
	archivedAt: '2030-01-02T08:00:00.000Z',
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('members registry UI', () => {
	it('renders compact member cards with names and status', () => {
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		expect(screen.getByRole('heading', { name: 'Members' })).toBeTruthy();

		expect(screen.getByRole('heading', { name: 'Example Active Member' })).toBeTruthy();

		expect(screen.getByText('Active')).toBeTruthy();
		expect(screen.getByText('+250 700 000 001')).toBeTruthy();
		expect(screen.getByText('1 loaded active profile')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('invites the owner to add the first member without a refresh action', () => {
		render(<MembersWorkspace initialItems={[]} initialNextCursor={null} />);

		expect(screen.getByRole('heading', { name: 'Register your first member' })).toBeTruthy();
		expect(
			screen.getByText(
				'Add their contact details and choose the membership plan they are joining.',
			),
		).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Add member' }).getAttribute('href')).toBe('/payments');
		expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
	});

	it('searches only loaded member records', () => {
		render(
			<MembersWorkspace initialItems={[activeMember, secondMember]} initialNextCursor={null} />,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Search members' }));

		fireEvent.change(screen.getByRole('searchbox'), {
			target: { value: 'zoe@example.com' },
		});

		expect(screen.getAllByRole('article')).toHaveLength(1);
		expect(screen.getByRole('heading', { name: 'Zoe Member' })).toBeTruthy();
		expect(screen.getByText(/1 of 2 loaded profiles match/)).toBeTruthy();

		fireEvent.click(screen.getByRole('button', { name: 'Close search' }));

		expect(screen.getAllByRole('article')).toHaveLength(2);
	});

	it('shows the correct empty state for an unmatched search', () => {
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Search members' }));

		fireEvent.change(screen.getByRole('searchbox'), {
			target: { value: 'unknown person' },
		});

		expect(screen.getByText('No matching members')).toBeTruthy();
		expect(screen.queryByRole('article')).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

		expect(screen.getAllByRole('article')).toHaveLength(1);
	});

	it('switches between active and archived profiles', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [archivedMember],
				nextCursor: null,
			}),
		);

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Filter by status: Active' }));

		fireEvent.click(screen.getByRole('button', { name: /^Archived$/ }));

		expect(await screen.findByRole('heading', { name: 'Example Archived Member' })).toBeTruthy();

		expect(screen.queryByRole('heading', { name: 'Example Active Member' })).toBeNull();

		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('status=ARCHIVED');
	});

	it('sorts only loaded members', () => {
		render(
			<MembersWorkspace initialItems={[activeMember, secondMember]} initialNextCursor={null} />,
		);

		let cards = screen.getAllByRole('article');

		expect(within(cards[0]!).getByRole('heading').textContent).toBe('Zoe Member');

		fireEvent.click(screen.getByRole('button', { name: 'Sort members: Newest first' }));

		fireEvent.click(screen.getByRole('button', { name: 'Name: A to Z' }));

		cards = screen.getAllByRole('article');

		expect(within(cards[0]!).getByRole('heading').textContent).toBe('Example Active Member');
	});

	it('refreshes details and loads plan history when opening a member', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(activeMember));
		fetchMock.mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Example Active Member' }));

		const dialog = await screen.findByRole('dialog', {
			name: 'Example Active Member',
		});

		expect(within(dialog).getByText('Not provided')).toBeTruthy();
		expect(within(dialog).getByText('+250 700 000 001')).toBeTruthy();
		expect(await within(dialog).findByText('No plan registrations recorded.')).toBeTruthy();

		fireEvent.click(within(dialog).getByRole('button', { name: 'Close details' }));

		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('confirms archival and refreshes the registry only after success', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(activeMember));
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
		fetchMock.mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);
		fireEvent.click(screen.getByRole('button', { name: `Archive ${activeMember.name}` }));
		const confirm = await screen.findByRole('button', { name: /^Archive member$/ });
		fireEvent.click(confirm);
		expect(await screen.findByText('Member archived.')).toBeTruthy();
		await waitFor(() => expect(screen.queryByRole('article')).toBeNull());
		expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('DELETE');
	});

	it('keeps the archive dialog open when current registrations block archival', async () => {
		fetchMock.mockResolvedValueOnce(Response.json(activeMember));
		fetchMock.mockResolvedValueOnce(Response.json({}, { status: 409 }));
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);
		fireEvent.click(screen.getByRole('button', { name: `Archive ${activeMember.name}` }));
		fireEvent.click(await screen.findByRole('button', { name: /^Archive member$/ }));
		await waitFor(() =>
			expect(
				screen.getAllByText('Cancel current and future registrations before archiving this member.')
					.length,
			).toBeGreaterThan(0),
		);
		expect(screen.getByRole('dialog', { name: 'Archive member' })).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('loads the next cursor page without duplicates', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [activeMember, secondMember],
				nextCursor: null,
			}),
		);

		render(
			<MembersWorkspace
				initialItems={[activeMember]}
				initialNextCursor="44444444-4444-4444-8444-444444444444"
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

		expect(await screen.findByRole('heading', { name: 'Zoe Member' })).toBeTruthy();

		expect(screen.getAllByRole('article')).toHaveLength(2);
		expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
	});

	it('does not present service failures as an empty gym', () => {
		render(
			<MembersWorkspace initialItems={[]} initialNextCursor={null} initialErrorStatus={503} />,
		);

		expect(screen.getByText('Members unavailable')).toBeTruthy();
		expect(screen.queryByText('Register your first member')).toBeNull();
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
	});

	it('clears member data when owner access is denied', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ message: 'Forbidden' }, { status: 403 }));

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Filter by status: Active' }));
		fireEvent.click(screen.getByRole('button', { name: /^Archived$/ }));

		await waitFor(() => {
			expect(screen.getByText('Access denied')).toBeTruthy();
		});

		expect(screen.queryByRole('article')).toBeNull();
		expect(screen.queryByText('Register your first member')).toBeNull();
	});

	it('does not overwrite newer results with stale responses', async () => {
		let finishFirstRequest: ((response: Response) => void) | undefined;

		fetchMock
			.mockImplementationOnce(
				() =>
					new Promise<Response>((resolve) => {
						finishFirstRequest = resolve;
					}),
			)
			.mockResolvedValueOnce(
				Response.json({
					items: [activeMember],
					nextCursor: null,
				}),
			);

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Filter by status: Active' }));
		fireEvent.click(screen.getByRole('button', { name: /^Archived$/ }));

		fireEvent.click(screen.getByRole('button', { name: 'Filter by status: Archived' }));

		fireEvent.click(screen.getByRole('button', { name: /^Active$/ }));

		expect(await screen.findByRole('heading', { name: 'Example Active Member' })).toBeTruthy();

		finishFirstRequest?.(
			Response.json({
				items: [archivedMember],
				nextCursor: null,
			}),
		);

		await waitFor(() => {
			expect(screen.queryByRole('heading', { name: 'Example Archived Member' })).toBeNull();
		});
	});
});
