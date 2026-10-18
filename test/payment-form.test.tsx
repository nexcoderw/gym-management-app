// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const plan = {
	id: '11111111-1111-4111-8111-111111111111',
	name: 'Monthly',
	price: 30_000,
	currency: 'RWF' as const,
	description: null,
	status: 'ACTIVE' as const,
	createdAt: '2030-01-01T00:00:00.000Z',
	updatedAt: '2030-01-01T00:00:00.000Z',
	archivedAt: null,
};

vi.mock('@/components/members/member-plan-select', () => ({
	MemberPlanSelect: ({
		value,
		onChange,
		error,
	}: {
		value: string;
		onChange: (value: string, selected: typeof plan) => void;
		error?: string;
	}) => (
		<>
			<label htmlFor="test-payment-plan">Membership plan</label>
			<select
				id="test-payment-plan"
				value={value}
				onChange={(event) => onChange(event.target.value, plan)}
			>
				<option value="">Choose plan</option>
				<option value={plan.id}>Monthly</option>
			</select>
			{error ? <p>{error}</p> : null}
		</>
	),
}));

import { PaymentForm } from '@/components/payments/payment-form';

afterEach(cleanup);

describe('payment wizard', () => {
	it('validates each step and submits a normalized optional email', async () => {
		const submit = vi.fn().mockResolvedValue(undefined);
		render(
			<PaymentForm
				pending={false}
				submissionError={null}
				onCancel={vi.fn()}
				onSubmit={submit}
			/>,
		);

		expect(screen.getByRole('heading', { name: 'Member details' })).toBeTruthy();
		expect(screen.queryByLabelText('Membership plan')).toBeNull();
		fireEvent.change(screen.getByLabelText('Full name'), {
			target: { value: 'Example Member' },
		});
		fireEvent.change(screen.getByLabelText('Phone number'), {
			target: { value: '+250700000001' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

		expect(await screen.findByRole('heading', { name: 'Membership details' })).toBeTruthy();
		fireEvent.change(screen.getByLabelText('Membership plan'), {
			target: { value: plan.id },
		});
		fireEvent.change(screen.getByLabelText('Start date'), {
			target: { value: '2030-01-01' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

		expect(await screen.findByRole('heading', { name: 'Payment details' })).toBeTruthy();
		expect(screen.getByText('30,000 RWF')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Register and record payment' }));

		await waitFor(() => expect(submit).toHaveBeenCalledOnce());
		expect(submit.mock.calls[0]?.[0]).toMatchObject({
			member: {
				name: 'Example Member',
				phoneNumber: '+250700000001',
				email: null,
			},
			subscription: {
				membershipPlanId: plan.id,
				startDate: '2030-01-01',
				periodUnit: 'MONTHS',
				periodCount: 1,
			},
			method: 'CASH',
		});
	});
});
