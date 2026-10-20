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
const showModalDescriptor = Object.getOwnPropertyDescriptor(
	HTMLDialogElement.prototype,
	'showModal',
);
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
		configurable: true,
		value(this: HTMLDialogElement) {
			this.open = true;
		},
	});
	Object.defineProperty(HTMLDialogElement.prototype, 'close', {
		configurable: true,
		value(this: HTMLDialogElement) {
			this.open = false;
		},
	});
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	if (showModalDescriptor)
		Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModalDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
	if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('members registry UI', () => {
	it('renders compact member cards with names and status', () => {
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		expect(screen.getByRole('heading', { name: 'Members' })).toBeTruthy();

		expect(screen.getByRole('heading', { name: 'Example Active Member' })).toBeTruthy();

		expect(
			within(screen.getByRole('article', { name: 'Example Active Member' })).getByText('Active'),
		).toBeTruthy();
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

	it('searches loaded member records without another request', async () => {
		render(
			<MembersWorkspace initialItems={[activeMember, secondMember]} initialNextCursor={null} />,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Search members' }));

		fireEvent.change(screen.getByRole('searchbox'), {
			target: { value: 'zoe@example.com' },
		});

		expect(await screen.findByRole('heading', { name: 'Zoe Member' })).toBeTruthy();
		expect(screen.getAllByRole('article')).toHaveLength(1);
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Close search' }));

		expect(screen.getAllByRole('article')).toHaveLength(2);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows the correct empty state for an unmatched search', async () => {
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Search members' }));

		fireEvent.change(screen.getByRole('searchbox'), {
			target: { value: 'unknown person' },
		});

		expect(await screen.findByText('No matching members')).toBeTruthy();
		expect(screen.queryByRole('article')).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

		expect(screen.getAllByRole('article')).toHaveLength(1);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('switches between active and archived profiles', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [archivedMember],
				nextCursor: null,
			}),
		);

		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		expect(screen.getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true);
		fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
			target: { value: 'ARCHIVED' },
		});
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

		expect(await screen.findByRole('heading', { name: 'Example Archived Member' })).toBeTruthy();

		expect(screen.queryByRole('heading', { name: 'Example Active Member' })).toBeNull();

		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('status=ARCHIVED');
	});

	it('requests member ordering from the backend', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ items: [activeMember, secondMember], nextCursor: null }),
		);
		render(
			<MembersWorkspace initialItems={[secondMember, activeMember]} initialNextCursor={null} />,
		);

		const cards = screen.getAllByRole('article');

		expect(within(cards[0]!).getByRole('heading').textContent).toBe('Zoe Member');

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		fireEvent.change(screen.getByRole('combobox', { name: 'Order' }), {
			target: { value: 'name-asc' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

		await waitFor(() => expect(String(fetchMock.mock.calls[0]?.[0])).toContain('order=NAME_ASC'));
		await waitFor(() =>
			expect(within(screen.getAllByRole('article')[0]!).getByRole('heading').textContent).toBe(
				'Example Active Member',
			),
		);
	});

	it('discards closed drafts and applies status, order, and dates in one request', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ items: [archivedMember], nextCursor: null }));
		render(<MembersWorkspace initialItems={[activeMember]} initialNextCursor={null} />);

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
			target: { value: 'ARCHIVED' },
		});
		fireEvent.click(screen.getByRole('button', { name: /^Close$/ }));
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		expect(screen.getByRole('combobox', { name: 'Status' })).toHaveProperty('value', 'ACTIVE');
		expect(screen.getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true);
		fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
			target: { value: 'ARCHIVED' },
		});
		fireEvent.change(screen.getByRole('combobox', { name: 'Order' }), {
			target: { value: 'name-desc' },
		});
		fireEvent.change(screen.getByLabelText('Registered from'), {
			target: { value: '2030-01-01' },
		});
		fireEvent.change(screen.getByLabelText('Registered through'), {
			target: { value: '2030-01-31' },
		});
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const request = String(fetchMock.mock.calls[0]?.[0]);
		expect(request).toContain('status=ARCHIVED');
		expect(request).toContain('order=NAME_DESC');
		expect(request).toContain('fromDate=2030-01-01');
		expect(request).toContain('toDate=2030-01-31');
		expect(await screen.findByRole('heading', { name: 'Example Archived Member' })).toBeTruthy();
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
		const firstPage = Array.from({ length: 24 }, (_, index) => ({
			...activeMember,
			id: `11111111-1111-4111-8111-${String(index + 1).padStart(12, '0')}`,
			name: `Member ${index + 1}`,
		}));
		fetchMock.mockResolvedValueOnce(
			Response.json({
				items: [firstPage[0], secondMember],
				nextCursor: null,
			}),
		);

		render(
			<MembersWorkspace
				initialItems={firstPage}
				initialNextCursor="44444444-4444-4444-8444-444444444444"
			/>,
		);

		expect(screen.getAllByRole('article')).toHaveLength(24);
		fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

		expect(await screen.findByRole('heading', { name: 'Zoe Member' })).toBeTruthy();
		expect(screen.getAllByRole('article')).toHaveLength(1);
		fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
		expect(screen.getAllByRole('article')).toHaveLength(24);
		expect(fetchMock).toHaveBeenCalledTimes(1);
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

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
			target: { value: 'ARCHIVED' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

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

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
			target: { value: 'ARCHIVED' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
			target: { value: 'ACTIVE' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

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
