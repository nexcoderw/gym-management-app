import { describe, expect, it } from 'vitest';

import { paymentEndDate } from '@/components/payments/payment-period';

describe('payment period preview', () => {
	it('uses an inclusive end date for monthly and weekly registrations', () => {
		expect(paymentEndDate('2030-01-01', 'MONTHS', 1)).toBe('2030-01-31');
		expect(paymentEndDate('2030-01-01', 'WEEKS', 2)).toBe('2030-01-14');
	});

	it('clamps month anniversaries and rejects invalid dates or counts', () => {
		expect(paymentEndDate('2028-01-31', 'MONTHS', 1)).toBe('2028-02-28');
		expect(paymentEndDate('2030-02-30', 'MONTHS', 1)).toBeNull();
		expect(paymentEndDate('2030-01-01', 'YEARS', 11)).toBeNull();
	});
});
