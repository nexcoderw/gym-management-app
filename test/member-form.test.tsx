// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/members/member-plan-select', () => ({
	MemberPlanSelect: ({
		value,
		onChange,
		error,
	}: {
		value: string;
		onChange: (value: string) => void;
		error?: string;
	}) => (
		<>
			<label htmlFor="test-plan">Membership plan</label>
			<select id="test-plan" value={value} onChange={(event) => onChange(event.target.value)}>
				<option value="">Choose plan</option>
				<option value="11111111-1111-4111-8111-111111111111">Monthly</option>
			</select>
			{error ? <p>{error}</p> : null}
		</>
	),
}));

import { MemberForm } from '@/components/members/member-form';

afterEach(cleanup);

describe('shared member form', () => {
	it('shows inline validation and prevents invalid registration', async () => {
		const submit = vi.fn();
		render(<MemberForm pending={false} onSubmit={submit} onCancel={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
		expect(await screen.findByText('Enter the member name.')).toBeTruthy();
		expect(submit).not.toHaveBeenCalled();
	});

	it('separates contact details from membership terms', async () => {
		render(<MemberForm pending={false} onSubmit={vi.fn()} onCancel={vi.fn()} />);

		expect(screen.getByRole('heading', { name: 'Contact details' })).toBeTruthy();
		expect(screen.queryByLabelText('Membership plan')).toBeNull();
		expect(screen.getByPlaceholderText('e.g. Jean Uwimana')).toBeTruthy();
		expect(screen.getByPlaceholderText('e.g. +250 788 123 456')).toBeTruthy();
		expect(screen.getByPlaceholderText('e.g. jean@example.com')).toBeTruthy();

		fireEvent.change(screen.getByLabelText('Member name'), { target: { value: 'Example Member' } });
		fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0700000001' } });
		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

		expect(await screen.findByRole('heading', { name: 'Membership details' })).toBeTruthy();
		expect(screen.getByLabelText('Membership plan')).toBeTruthy();
		expect(screen.getByLabelText('Start date')).toBeTruthy();
		expect(screen.getByLabelText('Period')).toBeTruthy();
		expect(screen.getByLabelText('Duration')).toBeTruthy();
	});

	it('retains the registration key for identical retries and replaces it for edited details', async () => {
		const submit = vi.fn().mockResolvedValue(undefined);
		render(<MemberForm pending={false} onSubmit={submit} onCancel={vi.fn()} />);
		fireEvent.change(screen.getByLabelText('Member name'), { target: { value: 'Example Member' } });
		fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0700000001' } });
		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
		await screen.findByRole('heading', { name: 'Membership details' });
		fireEvent.change(screen.getByLabelText('Membership plan'), {
			target: { value: '11111111-1111-4111-8111-111111111111' },
		});
		fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2030-01-01' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
		await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
		fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
		await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
		expect(submit.mock.calls[0]?.[0].idempotencyKey).toBe(submit.mock.calls[1]?.[0].idempotencyKey);
		fireEvent.click(screen.getByRole('button', { name: 'Back' }));
		fireEvent.change(screen.getByLabelText('Member name'), {
			target: { value: 'Example Updated' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
		await screen.findByRole('heading', { name: 'Membership details' });
		fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
		await waitFor(() => expect(submit).toHaveBeenCalledTimes(3));
		expect(submit.mock.calls[2]?.[0].idempotencyKey).not.toBe(
			submit.mock.calls[0]?.[0].idempotencyKey,
		);
	});

	it('edits contact fields without requiring or changing a plan', () => {
		const submit = vi.fn().mockResolvedValue(undefined);
		render(
			<MemberForm
				member={{
					id: '11111111-1111-4111-8111-111111111111',
					name: 'Example Member',
					phoneNumber: '+250700000001',
					email: null,
					status: 'ACTIVE',
					createdAt: '2030-01-01T00:00:00.000Z',
					updatedAt: '2030-01-01T00:00:00.000Z',
					archivedAt: null,
				}}
				pending={false}
				onSubmit={submit}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.queryByLabelText('Membership plan')).toBeNull();
		expect(screen.getByPlaceholderText('e.g. Jean Uwimana')).toBeTruthy();
		expect(screen.getByPlaceholderText('e.g. +250 788 123 456')).toBeTruthy();
		expect(screen.getByPlaceholderText('e.g. jean@example.com')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
		await waitFor(() => expect(submit).toHaveBeenCalledOnce());
	});
});
