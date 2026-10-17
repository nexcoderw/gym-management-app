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
