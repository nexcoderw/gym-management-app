import { z } from 'zod';

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

export type MembershipPlan = z.infer<typeof membershipPlanSchema>;
export type MembershipPlanInput = z.infer<typeof membershipPlanInputSchema>;
