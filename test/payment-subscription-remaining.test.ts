import { describe, expect, it } from 'vitest';

import {
	kigaliCalendarDate,
	subscriptionCountdown,
} from '@/components/payments/payment-subscription-remaining';

describe('payment subscription countdown', () => {
	it('uses the Kigali calendar date, not the server UTC date', () => {
		expect(kigaliCalendarDate(new Date('2030-01-01T22:30:00.000Z'))).toBe('2030-01-02');
	});

	it('distinguishes scheduled, healthy, soon, urgent and expired subscriptions', () => {
		expect(subscriptionCountdown('2030-02-01', '2030-02-28', '2030-01-30')).toEqual({
			label: 'Starts in 2 days',
			tone: 'scheduled',
		});
		expect(subscriptionCountdown('2030-01-01', '2030-01-31', '2030-01-10')).toEqual({
			label: '21 days left',
			tone: 'healthy',
		});
		expect(subscriptionCountdown('2030-01-01', '2030-01-31', '2030-01-21')).toEqual({
			label: '10 days left',
			tone: 'soon',
		});
		expect(subscriptionCountdown('2030-01-01', '2030-01-31', '2030-01-28')).toEqual({
			label: '3 days left',
			tone: 'urgent',
		});
		expect(subscriptionCountdown('2030-01-01', '2030-01-31', '2030-01-31')).toEqual({
			label: '0 days left',
			tone: 'urgent',
		});
		expect(subscriptionCountdown('2030-01-01', '2030-01-31', '2030-02-01')).toEqual({
			label: 'Expired',
			tone: 'expired',
		});
	});
});
