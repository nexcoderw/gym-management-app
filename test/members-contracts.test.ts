import { describe, expect, it } from 'vitest';

import { memberListSchema, memberSchema } from '@/lib/contracts';

const member = {
	id: '11111111-1111-4111-8111-111111111111',
	name: 'Example Member',
	phoneNumber: '+250 700 000 001',
	email: null,
	status: 'ACTIVE',
	createdAt: '2030-01-01T08:00:00.000Z',
	updatedAt: '2030-01-01T08:00:00.000Z',
	archivedAt: null,
};

describe('member listing contracts', () => {
	it('accepts a valid active member', () => {
		expect(memberSchema.parse(member)).toEqual(member);
	});

	it('accepts a valid archived member', () => {
		const result = memberSchema.parse({
			...member,
			status: 'ARCHIVED',
			archivedAt: '2030-01-02T08:00:00.000Z',
		});

		expect(result.status).toBe('ARCHIVED');
	});

	it('rejects unknown fields', () => {
		expect(() =>
			memberSchema.parse({
				...member,
				privateToken: 'unexpected-value',
			}),
		).toThrow();
	});

	it('rejects malformed member identifiers', () => {
		expect(() =>
			memberSchema.parse({
				...member,
				id: 'not-a-uuid',
			}),
		).toThrow();
	});

	it('rejects invalid email addresses', () => {
		expect(() =>
			memberSchema.parse({
				...member,
				email: 'invalid-email',
			}),
		).toThrow();
	});

	it('accepts an empty page as a successful response', () => {
		expect(
			memberListSchema.parse({
				items: [],
				nextCursor: null,
			}),
		).toEqual({
			items: [],
			nextCursor: null,
		});
	});

	it('rejects oversized member pages', () => {
		expect(() =>
			memberListSchema.parse({
				items: Array.from({ length: 51 }, (_, index) => ({
					...member,
					id: `${String(index).padStart(8, '0')}-1111-4111-8111-111111111111`,
				})),
				nextCursor: null,
			}),
		).toThrow();
	});
});
