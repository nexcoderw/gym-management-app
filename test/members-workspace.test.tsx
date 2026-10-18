// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MembersWorkspace } from '@/components/members/members-workspace';
import type { Member } from '@/lib/contracts';

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

describe('members listing workspace', () => {
	it('renders the initial server-provided member profiles', () => {
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		expect(screen.getByRole('heading', { name: 'Members' })).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'Example Active Member' })).toBeTruthy();
		expect(screen.getByText('+250 700 000 001')).toBeTruthy();
		expect(screen.getByText('1 loaded active profile')).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('fetches archived profiles when the filter changes', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [archivedMember],
				nextCursor: null,
			}),
		);

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.change(screen.getByLabelText('Profile status'), {
			target: { value: 'ARCHIVED' },
		});

		expect(await screen.findByRole('heading', { name: 'Example Archived Member' })).toBeTruthy();

		expect(screen.queryByRole('heading', { name: 'Example Active Member' })).toBeNull();

		const requestUrl = String(fetchMock.mock.calls[0]?.[0]);

		expect(requestUrl).toContain('status=ARCHIVED');
		expect(requestUrl).toContain('limit=20');
	});

	it('appends the next page without duplicating members', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [
					activeMember,
					{
						...activeMember,
						id: '33333333-3333-4333-8333-333333333333',
						name: 'Second Member',
					},
				],
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

		expect(await screen.findByRole('heading', { name: 'Second Member' })).toBeTruthy();

		expect(screen.getAllByRole('article')).toHaveLength(2);
		expect(screen.getByText('2 loaded active profiles')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
	});

	it('does not present an API failure as an empty gym', () => {
		render(
			<MembersWorkspace initialItems={[]} initialNextCursor={null} initialErrorStatus={503} />,
		);

		expect(screen.getByText('Members unavailable')).toBeTruthy();
		expect(screen.queryByText('No active members yet')).toBeNull();
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
	});

	it('clears private records after an access denial', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ message: 'Forbidden' }, { status: 403 }));

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

		await waitFor(() => {
			expect(screen.getByText('Access denied')).toBeTruthy();
		});

		expect(screen.queryByRole('heading', { name: 'Example Active Member' })).toBeNull();
		expect(screen.queryByText('No active members yet')).toBeNull();
	});

	it('does not let an older response overwrite a newer filter', async () => {
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
					items: [archivedMember],
					nextCursor: null,
				}),
			);

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

		fireEvent.change(screen.getByLabelText('Profile status'), {
			target: { value: 'ARCHIVED' },
		});

		expect(await screen.findByRole('heading', { name: 'Example Archived Member' })).toBeTruthy();

		finishFirstRequest?.(
			Response.json({
				items: [activeMember],
				nextCursor: null,
			}),
		);

		await waitFor(() => {
			expect(screen.queryByRole('heading', { name: 'Example Active Member' })).toBeNull();
		});
	});
});
