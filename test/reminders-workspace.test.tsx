// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import type { UpcomingReminderItem } from '@/lib/contracts';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const upcoming: UpcomingReminderItem = {
	subscriptionId: '33333333-3333-4333-8333-333333333333',
	memberId: '22222222-2222-4222-8222-222222222222',
	memberName: 'Example Member',
	planName: 'Monthly',
	endDate: '2030-01-31',
	daysRemaining: 10,
	canSend: true,
	manualStatus: null,
};

const showModalDescriptor = Object.getOwnPropertyDescriptor(
	HTMLDialogElement.prototype,
	'showModal',
);
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
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
	refresh.mockReset();
	vi.unstubAllGlobals();
	if (showModalDescriptor)
		Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModalDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
	if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('reminders workspace', () => {
	it('shows upcoming reminders without the recent email activity section', () => {
		render(<RemindersWorkspace upcoming={[upcoming]} />);
		expect(screen.getByRole('table', { name: /memberships ending/iu })).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'Recent email activity' })).toBeNull();
	});

	it('distinguishes provider acceptance from confirmed delivery in the reminders table', () => {
		render(
			<RemindersWorkspace
				upcoming={[
					{ ...upcoming, canSend: false, manualStatus: 'ACCEPTED' },
					{
						...upcoming,
						subscriptionId: '44444444-4444-4444-8444-444444444444',
						canSend: false,
						manualStatus: 'DELIVERED',
					},
				]}
			/>,
		);
		expect(screen.getByText('Provider accepted')).toBeTruthy();
		expect(screen.getByText('Delivered')).toBeTruthy();
	});

	it('searches upcoming members through the backend after three characters', async () => {
		const second = {
			...upcoming,
			subscriptionId: '44444444-4444-4444-8444-444444444444',
			memberName: 'Second Member',
			canSend: false,
		};
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ items: [second], nextCursor: null }));
		vi.stubGlobal('fetch', fetchMock);
		render(<RemindersWorkspace upcoming={[upcoming, second]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Search reminders' }));
		fireEvent.change(screen.getByRole('searchbox', { name: 'Search expiring memberships' }), {
			target: { value: 'Se' },
		});
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.change(screen.getByRole('searchbox', { name: 'Search expiring memberships' }), {
			target: { value: 'Second' },
		});
		const registry = screen.getByRole('table', { name: /memberships ending/iu });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain('search=Second');
		await waitFor(() => expect(within(registry).queryByText('Example Member')).toBeNull());
		expect(within(registry).getByText('Second Member')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		const sheet = screen.getByRole('dialog', { name: 'Filter reminders' });
		expect(within(sheet).getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(
			true,
		);
		fireEvent.change(within(sheet).getByLabelText('Status'), { target: { value: 'READY' } });
		fireEvent.click(within(sheet).getByRole('button', { name: 'Apply' }));
		expect(screen.getByRole('heading', { name: 'No matching members' })).toBeTruthy();
	});

	it('does not present stale reminders as matching results after a failed search', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				Response.json({ message: 'The service is temporarily unavailable.' }, { status: 503 }),
			);
		vi.stubGlobal('fetch', fetchMock);
		render(<RemindersWorkspace upcoming={[upcoming]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Search reminders' }));
		fireEvent.change(screen.getByRole('searchbox', { name: 'Search expiring memberships' }), {
			target: { value: 'Unknown' },
		});
		expect(
			await screen.findByRole('heading', { name: 'Expiring memberships unavailable' }),
		).toBeTruthy();
		expect(screen.queryByRole('table', { name: /memberships ending/iu })).toBeNull();
	});

	it('prefills an editable email and queues only the approved copy', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				new Response(
					JSON.stringify({ id: '55555555-5555-4555-8555-555555555555', status: 'QUEUED' }),
					{ status: 202, headers: { 'Content-Type': 'application/json' } },
				),
			);
		vi.stubGlobal('fetch', fetchMock);
		render(<RemindersWorkspace upcoming={[upcoming]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Send reminder' }));
		expect(fetchMock).not.toHaveBeenCalled();
		const dialog = screen.getByRole('dialog', { name: 'Send email reminder' });
		expect(within(dialog).getByLabelText('Subject')).toHaveProperty(
			'value',
			'Your Monthly membership is ending soon',
		);
		fireEvent.change(within(dialog).getByLabelText('Message'), {
			target: { value: 'Hello Example Member, please renew at the gym.' },
		});
		fireEvent.click(within(dialog).getByRole('button', { name: 'Send email' }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'/api/reminders/subscriptions/33333333-3333-4333-8333-333333333333/deliveries',
		);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			subject: 'Your Monthly membership is ending soon',
			body: 'Hello Example Member, please renew at the gym.',
		});
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Send reminder' })).toBeNull());
		expect(screen.getByText('Queued')).toBeTruthy();
	});

	it('keeps invalid message copy in the dialog without making a request', () => {
		const fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);
		render(<RemindersWorkspace upcoming={[upcoming]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Send reminder' }));
		const dialog = screen.getByRole('dialog', { name: 'Send email reminder' });
		fireEvent.change(within(dialog).getByLabelText('Message'), { target: { value: '   ' } });
		fireEvent.click(within(dialog).getByRole('button', { name: 'Send email' }));
		expect(within(dialog).getByRole('alert').textContent).toMatch(/enter a message/iu);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('separates an empty upcoming list from a failed read', () => {
		const view = render(<RemindersWorkspace upcoming={[]} />);
		expect(screen.getByRole('heading', { name: 'No memberships nearing expiry' })).toBeTruthy();
		view.rerender(<RemindersWorkspace upcomingErrorStatus={503} />);
		expect(screen.getByRole('alert')).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'No memberships nearing expiry' })).toBeNull();
	});
});
