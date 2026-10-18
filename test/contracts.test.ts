import { describe, expect, it } from 'vitest';
import {
	acceptedSchema,
	enrollmentChallengeSchema,
	membershipPlanInputSchema,
	membershipPlanSchema,
	sessionSchema,
} from '@/lib/contracts';

describe('owner portal contracts', () => {
	it('accepts a bounded invitation challenge without an invitation token', () => {
		const result = enrollmentChallengeSchema.parse({
			nextStep: 'sign_in',
			challengeToken: 'a'.repeat(43),
			expiresAt: '2030-01-01T00:10:00.000Z',
			organizationName: 'Kigali Strength Club',
			organizationStatus: 'PENDING',
		});
		expect(result).not.toHaveProperty('invitationToken');
	});

	it('rejects an accepted response without tenant-bound identifiers', () => {
		expect(() => acceptedSchema.parse({ status: 'accepted' })).toThrow();
	});

	it('requires organization-scoped roles in a live owner session', () => {
		const result = sessionSchema.parse({
			userId: '11111111-1111-4111-8111-111111111111',
			displayName: 'Aline Uwase',
			email: 'aline@example.com',
			assurance: 'aal1',
			expiresAt: '2030-01-01T08:00:00.000Z',
			organizations: [
				{
					organizationId: '22222222-2222-4222-8222-222222222222',
					name: 'Kigali Strength Club',
					slug: 'kigali-strength-club',
					status: 'ACTIVE',
					membershipId: '33333333-3333-4333-8333-333333333333',
					roles: ['owner'],
				},
			],
		});
		expect(result.organizations[0]?.roles).toEqual(['owner']);
	});

	it('accepts a tenant membership plan with an optional description', () => {
		const result = membershipPlanSchema.parse({
			id: '44444444-4444-4444-8444-444444444444',
			name: 'Monthly strength',
			price: 35_000,
			currency: 'RWF',
			description: null,
			status: 'ACTIVE',
			createdAt: '2030-01-01T08:00:00.000Z',
			updatedAt: '2030-01-01T08:00:00.000Z',
			archivedAt: null,
		});
		expect(result.description).toBeNull();
	});

	it('rejects decimal and formatted membership prices before submission', () => {
		expect(() =>
			membershipPlanInputSchema.parse({
				name: 'Monthly strength',
				price: '35,000.50',
				description: '',
			}),
		).toThrow();
	});
});
