// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MembershipForm } from '@/components/memberships/membership-form';

afterEach(cleanup);

describe('membership form', () => {
	it('shows inline errors and does not submit invalid details', async () => {
		const submit = vi.fn();
		render(<MembershipForm pending={false} onCancel={vi.fn()} onSubmit={submit} />);

		fireEvent.click(screen.getByRole('button', { name: 'Create membership' }));

		expect(await screen.findByText('Enter a membership name.')).toBeTruthy();
		expect(screen.getByText('Enter a price in Rwandan francs.')).toBeTruthy();
		expect(submit).not.toHaveBeenCalled();
	});

	it('submits normalized valid details through the shared form', async () => {
		const submit = vi.fn().mockResolvedValue(undefined);
		render(<MembershipForm pending={false} onCancel={vi.fn()} onSubmit={submit} />);

		fireEvent.change(screen.getByLabelText('Membership name'), {
			target: { value: ' Monthly strength ' },
		});
		fireEvent.change(screen.getByLabelText('Price (RWF)'), { target: { value: '35000' } });
		fireEvent.change(screen.getByLabelText(/Activities and description/u), {
			target: { value: ' Gym floor and classes ' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Create membership' }));

		expect(submit).toHaveBeenCalledWith({
			name: 'Monthly strength',
			price: '35000',
			description: 'Gym floor and classes',
		});
	});
});
