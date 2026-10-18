import { z } from 'zod';

export const memberPeriodUnitSchema = z.enum(['DAYS', 'WEEKS', 'MONTHS', 'YEARS']);

const periodLimits = {
	DAYS: 3650,
	WEEKS: 520,
	MONTHS: 120,
	YEARS: 10,
} as const;

export const enrollmentChallengeSchema = z.object({
	nextStep: z.enum(['sign_in', 'register']),
	challengeToken: z.string().min(32).max(256),
	expiresAt: z.iso.datetime(),
	organizationName: z.string().min(1).max(160),
	organizationStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']),
});

export type EnrollmentChallenge = z.infer<typeof enrollmentChallengeSchema>;

export const authenticatedSchema = z.object({
	status: z.enum(['authenticated', 'verified']),
	expiresAt: z.iso.datetime(),
	csrfToken: z.string().min(16).max(512),
});

export const acceptedSchema = z.object({
	status: z.literal('accepted'),
	organizationId: z.uuid(),
	organizationName: z.string().min(1).max(160),
	organizationSlug: z.string().min(1).max(80),
	organizationStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']),
	membershipId: z.uuid(),
});

export const sessionSchema = z.object({
	userId: z.uuid(),
	displayName: z.string().min(1).max(160),
	email: z.email(),
	assurance: z.enum(['aal1', 'aal2']),
	expiresAt: z.iso.datetime(),
	organizations: z.array(
		z.object({
			organizationId: z.uuid(),
			name: z.string().min(1).max(160),
			slug: z.string().min(1).max(80),
			status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']),
			membershipId: z.uuid(),
			roles: z.array(z.string().min(1).max(80)).max(20),
		}),
	),
});

export type OwnerSession = z.infer<typeof sessionSchema>;

export const membershipPlanStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

export const membershipPlanSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1).max(120),
	price: z.number().int().min(0).max(1_000_000_000),
	currency: z.literal('RWF'),
	description: z.string().max(1000).nullable(),
	status: membershipPlanStatusSchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	archivedAt: z.iso.datetime().nullable(),
});

export const membershipPlanListSchema = z.object({
	items: z.array(membershipPlanSchema).max(50),
	nextCursor: z.uuid().nullable(),
});

export const membershipPlanInputSchema = z
	.object({
		name: z.string().trim().min(1, 'Enter a membership name.').max(120),
		price: z
			.string()
			.trim()
			.min(1, 'Enter a price in Rwandan francs.')
			.regex(/^\d+$/u, 'Use a whole amount without commas or decimals.')
			.refine((value) => Number(value) <= 1_000_000_000, 'Price must not exceed RWF 1 billion.'),
		description: z.string().trim().max(1000, 'Activities must be 1,000 characters or fewer.'),
	})
	.strict();

export const memberStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

export const memberSchema = z.strictObject({
	id: z.uuid(),
	name: z.string().min(1).max(160),
	phoneNumber: z.string().min(1).max(40),
	email: z.email().nullable(),
	status: memberStatusSchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	archivedAt: z.iso.datetime().nullable(),
});

export const memberListSchema = z.strictObject({
	items: z.array(memberSchema).max(50),
	nextCursor: z.uuid().nullable(),
});

const memberStartDateSchema = z
	.string()
	.regex(/^20\d{2}-\d{2}-\d{2}$/u, 'Enter a valid start date.')
	.refine((value) => {
		const parsed = new Date(`${value}T00:00:00.000Z`);
		return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
	}, 'Enter a real calendar date.');

const memberPhoneSchema = z
	.string()
	.trim()
	.min(1, 'Enter a phone number.')
	.max(40, 'Phone number is too long.')
	.refine((value) => {
		const normalized = value.replace(/[\s()-]/gu, '');
		return /^07\d{8}$/u.test(normalized) || /^\+[1-9]\d{7,14}$/u.test(normalized);
	}, 'Use a Rwandan 07 number or an international number.');

export const memberSubscriptionInputSchema = z
	.strictObject({
		membershipPlanId: z.uuid('Choose a membership plan.'),
		startDate: memberStartDateSchema,
		periodUnit: memberPeriodUnitSchema,
		periodCount: z.coerce.number<number>().int().min(1).max(3650),
	})
	.superRefine((value, context) => {
		if (value.periodCount > periodLimits[value.periodUnit]) {
			context.addIssue({
				code: 'custom',
				path: ['periodCount'],
				message: `Maximum for this duration is ${periodLimits[value.periodUnit]}.`,
			});
		}
	});

export const memberRegistrationInputSchema = z.strictObject({
	name: z
		.string()
		.transform((value) =>
			value
				.normalize('NFKC')
				.replace(/[\s\u0085]+/gu, ' ')
				.trim(),
		)
		.pipe(z.string().min(1, 'Enter the member name.').max(160)),
	phoneNumber: memberPhoneSchema,
	email: z
		.string()
		.trim()
		.max(254)
		.refine(
			(value) => value === '' || z.email().safeParse(value).success,
			'Enter a valid email address.',
		)
		.transform((value) => (value === '' ? null : value.toLocaleLowerCase('en-US'))),
	subscription: memberSubscriptionInputSchema,
	idempotencyKey: z.uuid(),
});

export const memberSubscriptionSchema = z.strictObject({
	id: z.uuid(),
	memberId: z.uuid(),
	membershipPlanId: z.uuid(),
	planName: z.string().min(1),
	price: z.number().int().min(0),
	currency: z.literal('RWF'),
	periodUnit: memberPeriodUnitSchema,
	periodCount: z.number().int().min(1),
	startDate: memberStartDateSchema,
	endDate: z.iso.date(),
	status: z.enum(['SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED']),
	createdAt: z.iso.datetime(),
	cancelledAt: z.iso.datetime().nullable(),
});

export const memberRegistrationResponseSchema = z.strictObject({
	member: memberSchema,
	subscription: memberSubscriptionSchema,
});

export const memberProfileInputSchema = memberRegistrationInputSchema.pick({
	name: true,
	phoneNumber: true,
	email: true,
});

export const memberUpdateInputSchema = memberProfileInputSchema.extend({
	updatedAt: z.iso.datetime(),
});

export const memberArchiveInputSchema = z.strictObject({ updatedAt: z.iso.datetime() });

export const memberSubscriptionListSchema = z.strictObject({
	items: z.array(memberSubscriptionSchema).max(50),
	nextCursor: z.uuid().nullable(),
});

export type MemberProfileInput = z.output<typeof memberProfileInputSchema>;
export type MemberSubscriptionList = z.infer<typeof memberSubscriptionListSchema>;

export type MembershipPlan = z.infer<typeof membershipPlanSchema>;
export type MembershipPlanInput = z.infer<typeof membershipPlanInputSchema>;
export type Member = z.infer<typeof memberSchema>;
export type MemberStatus = z.infer<typeof memberStatusSchema>;
export type MemberList = z.infer<typeof memberListSchema>;
export type MemberRegistrationInput = z.output<typeof memberRegistrationInputSchema>;
export type MemberRegistrationDraft = z.input<typeof memberRegistrationInputSchema>;
export type MemberRegistrationResponse = z.infer<typeof memberRegistrationResponseSchema>;
export type MemberPeriodUnit = z.infer<typeof memberPeriodUnitSchema>;
