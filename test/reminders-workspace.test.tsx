// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RemindersWorkspace } from '@/components/reminders/reminders-workspace';
import type { ReminderActivityItem } from '@/lib/contracts';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const reminder: ReminderActivityItem = {
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

afterEach(() => {
	cleanup();
	refresh.mockReset();
});

describe('reminders activity workspace', () => {
	it('does not present provider acceptance as delivery or offer a manual send action', () => {
		render(<RemindersWorkspace items={[reminder]} errorStatus={null} />);
		expect(screen.getByText('Submitted to email provider')).toBeTruthy();
		expect(screen.queryByRole('button', { name: /send sms|send email/iu })).toBeNull();
		expect(screen.getByText(/does not confirm inbox delivery/iu)).toBeTruthy();
	});

	it('filters the loaded activity by member and status', () => {
		render(
			<RemindersWorkspace
				items={[
					reminder,
					{
						...reminder,
						id: '33333333-3333-4333-8333-333333333333',
						memberName: 'Other Member',
						status: 'DELIVERED',
					},
				]}
				errorStatus={null}
			/>,
		);
		fireEvent.change(screen.getByRole('searchbox', { name: 'Search reminder activity' }), {
			target: { value: 'Other' },
		});
		expect(screen.queryByText('Example Member')).toBeNull();
		expect(screen.getByText('Other Member')).toBeTruthy();
		fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'ACCEPTED' } });
		expect(screen.getByRole('heading', { name: 'No matching reminders' })).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
		expect(screen.getByText('Example Member')).toBeTruthy();
	});

	it('distinguishes an empty feed from a failed read', () => {
		const view = render(<RemindersWorkspace items={[]} errorStatus={null} />);
		expect(screen.getByRole('heading', { name: 'No reminder activity yet' })).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Refresh activity' }));
		expect(refresh).toHaveBeenCalledOnce();
		view.rerender(<RemindersWorkspace items={[]} errorStatus={503} />);
		expect(screen.getByRole('alert')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Refresh activity' })).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'No reminder activity yet' })).toBeNull();
	});
});
