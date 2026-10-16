import { describe, expect, it } from 'vitest';
import { acceptedSchema, enrollmentChallengeSchema, sessionSchema } from '@/lib/contracts';

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
});
