// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import type { ReminderActivityItem, UpcomingReminderItem } from '@/lib/contracts';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const activity: ReminderActivityItem = {
	id: '11111111-1111-4111-8111-111111111111',
	memberId: '22222222-2222-4222-8222-222222222222',
	memberName: 'Example Member',
	planName: 'Monthly',
	kind: 'THREE_DAYS_BEFORE',
	status: 'ACCEPTED',
	dueDate: '2030-01-28',
	endDate: '2030-01-31',
	acceptedAt: '2030-01-28T08:00:00.000Z',
	deliveredAt: null,
};

const upcoming: UpcomingReminderItem = {
	subscriptionId: '33333333-3333-4333-8333-333333333333',
	memberId: activity.memberId,
	memberName: activity.memberName,
	planName: activity.planName,
	endDate: '2030-01-31',
	daysRemaining: 10,
	canSend: true,
	manualStatus: null,
};

const showModalDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
	Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
		configurable: true,
		value(this: HTMLDialogElement) { this.open = true; },
	});
	Object.defineProperty(HTMLDialogElement.prototype, 'close', {
		configurable: true,
		value(this: HTMLDialogElement) { this.open = false; },
	});
});

afterEach(() => {
	cleanup();
	refresh.mockReset();
	vi.unstubAllGlobals();
	if (showModalDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModalDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
	if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor);
	else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('reminders workspace', () => {
	it('keeps email acceptance distinct from inbox delivery', () => {
		render(<RemindersWorkspace items={[activity]} errorStatus={null} upcoming={[upcoming]} />);
		expect(screen.getByText('Submitted to email provider')).toBeTruthy();
		expect(screen.getByText(/does not confirm inbox delivery/iu)).toBeTruthy();
	});

	it('searches upcoming members and stages status and ordering in the shared sheet', () => {
		render(<RemindersWorkspace items={[]} errorStatus={null} upcoming={[upcoming, { ...upcoming, subscriptionId: '44444444-4444-4444-8444-444444444444', memberName: 'Second Member', canSend: false }]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Search reminders' }));
		fireEvent.change(screen.getByRole('searchbox', { name: 'Search expiring memberships' }), { target: { value: 'Second' } });
		const registry = screen.getByRole('table', { name: /memberships ending/iu });
		expect(within(registry).queryByText('Example Member')).toBeNull();
		expect(within(registry).getByText('Second Member')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
		const sheet = screen.getByRole('dialog', { name: 'Filter reminders' });
		expect(within(sheet).getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true);
		fireEvent.change(within(sheet).getByLabelText('Status'), { target: { value: 'READY' } });
		fireEvent.click(within(sheet).getByRole('button', { name: 'Apply' }));
		expect(screen.getByRole('heading', { name: 'No matching members' })).toBeTruthy();
	});

	it('queues a manual reminder only after confirmation and disables repeat sends', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: '55555555-5555-4555-8555-555555555555', status: 'QUEUED' }), { status: 202, headers: { 'Content-Type': 'application/json' } }));
		vi.stubGlobal('fetch', fetchMock);
		render(<RemindersWorkspace items={[]} errorStatus={null} upcoming={[upcoming]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Send reminder' }));
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.click(within(screen.getByRole('dialog', { name: 'Send email reminder' })).getByRole('button', { name: 'Queue reminder' }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
		expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/reminders/subscriptions/33333333-3333-4333-8333-333333333333/deliveries');
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Send reminder' })).toBeNull());
		expect(screen.getByText('Queued')).toBeTruthy();
	});

	it('separates an empty upcoming list from a failed read', () => {
		const view = render(<RemindersWorkspace items={[]} errorStatus={null} upcoming={[]} />);
		expect(screen.getByRole('heading', { name: 'No memberships nearing expiry' })).toBeTruthy();
		view.rerender(<RemindersWorkspace items={[]} errorStatus={null} upcomingErrorStatus={503} />);
		expect(screen.getByRole('alert')).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'No memberships nearing expiry' })).toBeNull();
	});
});
