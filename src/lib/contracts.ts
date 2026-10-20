import { z } from 'zod';

// PostgreSQL UUID columns may contain canonical IDs without RFC version/variant bits.
export const databaseIdSchema = z.guid();

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

export const reminderActivityItemSchema = z.strictObject({
	id: z.uuid(),
	memberId: databaseIdSchema,
	memberName: z.string().min(1).max(160),
	planName: z.string().min(1).max(120),
	kind: z.enum(['THREE_DAYS_BEFORE', 'EXPIRY_DAY', 'MANUAL']),
	status: z.enum(['ACCEPTED', 'DELIVERED', 'BOUNCED', 'FAILED', 'UNCERTAIN']),
	dueDate: z.iso.date(),
	endDate: z.iso.date(),
	acceptedAt: z.iso.datetime().nullable(),
	deliveredAt: z.iso.datetime().nullable(),
});

export const reminderActivitySchema = z.strictObject({
	items: z.array(reminderActivityItemSchema).max(50),
});

export type ReminderActivityItem = z.infer<typeof reminderActivityItemSchema>;

export const upcomingReminderItemSchema = z.strictObject({
	subscriptionId: databaseIdSchema,
	memberId: databaseIdSchema,
	memberName: z.string().min(1).max(160),
	planName: z.string().min(1).max(120),
	endDate: z.iso.date(),
	daysRemaining: z.number().int().min(0).max(14),
	canSend: z.boolean(),
	manualStatus: z
		.enum(['QUEUED', 'PROCESSING', 'ACCEPTED', 'DELIVERED', 'BOUNCED', 'FAILED', 'UNCERTAIN', 'SKIPPED'])
		.nullable(),
});

export const upcomingReminderSchema = z.strictObject({
	items: z.array(upcomingReminderItemSchema).max(24),
	nextCursor: databaseIdSchema.nullable(),
});

export const queuedReminderSchema = z.strictObject({
	id: databaseIdSchema,
	status: z.literal('QUEUED'),
});

export const manualReminderInputSchema = z.strictObject({
	subject: z.string().min(1).max(120).regex(/^[^\r\n\p{Cc}\p{Cf}]*\S[^\r\n\p{Cc}\p{Cf}]*$/u),
	body: z.string().min(1).max(2000).refine((value) => value.trim().length > 0),
});

export type ManualReminderInput = z.infer<typeof manualReminderInputSchema>;

export type UpcomingReminderItem = z.infer<typeof upcomingReminderItemSchema>;

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
	id: databaseIdSchema,
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
	nextCursor: databaseIdSchema.nullable(),
	totalItems: z.number().int().nonnegative().optional(),
	totalPages: z.number().int().nonnegative().optional(),
	page: z.number().int().positive().nullable().optional(),
});

export const numberedMemberListSchema = memberListSchema.extend({
	totalItems: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
	page: z.number().int().positive(),
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
	email: z.union([
		z
			.string()
			.trim()
			.max(254)
			.refine(
				(value) => value === '' || z.email().safeParse(value).success,
				'Enter a valid email address.',
			)
			.transform((value) => (value === '' ? null : value.toLocaleLowerCase('en-US'))),
		z.null(),
	]),
	subscription: memberSubscriptionInputSchema,
	idempotencyKey: z.uuid(),
});

export const memberSubscriptionSchema = z.strictObject({
	id: databaseIdSchema,
	memberId: databaseIdSchema,
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
	nextCursor: databaseIdSchema.nullable(),
});

export type MemberProfileInput = z.output<typeof memberProfileInputSchema>;
export type MemberSubscriptionList = z.infer<typeof memberSubscriptionListSchema>;

export type MembershipPlan = z.infer<typeof membershipPlanSchema>;
export type MembershipPlanInput = z.infer<typeof membershipPlanInputSchema>;
export type Member = z.infer<typeof memberSchema>;
export type MemberStatus = z.infer<typeof memberStatusSchema>;
export type MemberList = z.infer<typeof memberListSchema>;
export type NumberedMemberList = z.infer<typeof numberedMemberListSchema>;
export type MemberRegistrationInput = z.output<typeof memberRegistrationInputSchema>;
export type MemberRegistrationDraft = z.input<typeof memberRegistrationInputSchema>;
export type MemberRegistrationResponse = z.infer<typeof memberRegistrationResponseSchema>;
export type MemberPeriodUnit = z.infer<typeof memberPeriodUnitSchema>;

export const paymentMethodSchema = z.enum([
	'CASH',
	'MOBILE_MONEY',
	'BANK_TRANSFER',
	'CARD',
	'OTHER',
]);
export const paymentStatusSchema = z.enum([
	'PENDING',
	'CONFIRMED',
	'FAILED',
	'VOIDED',
	'PARTIALLY_REFUNDED',
	'REFUNDED',
]);
export const paymentOrderSchema = z.enum(['NEWEST', 'OLDEST', 'AMOUNT_HIGH', 'AMOUNT_LOW']);
export const memberOrderSchema = z.enum(['NEWEST', 'OLDEST', 'NAME_ASC', 'NAME_DESC']);
export const membershipPlanOrderSchema = z.enum(['PRICE_ASC', 'PRICE_DESC', 'NAME_ASC', 'NEWEST']);
export const listDateSchema = z.iso.date();

export const paymentSchema = z.strictObject({
	id: databaseIdSchema,
	receiptNumber: z.string().min(1),
	memberId: databaseIdSchema,
	memberName: z.string().min(1),
	amount: z.number().int().min(1).max(1_000_000_000),
	currency: z.literal('RWF'),
	method: paymentMethodSchema,
	status: paymentStatusSchema,
	providerReference: z.string().nullable(),
	note: z.string().nullable(),
	occurredAt: z.iso.datetime(),
	confirmedAt: z.iso.datetime().nullable(),
	voidedAt: z.iso.datetime().nullable(),
	voidReason: z.string().nullable(),
	createdAt: z.iso.datetime(),
	allocations: z.array(
		z.strictObject({
			subscriptionId: databaseIdSchema,
			planName: z.string().min(1),
			amount: z.number().int().min(1),
			startDate: z.iso.date(),
			endDate: z.iso.date(),
		}),
	),
	refunds: z.array(
		z.strictObject({
			id: z.uuid(),
			amount: z.number().int().min(1),
			status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
			reason: z.string(),
			providerReference: z.string().nullable(),
			createdAt: z.iso.datetime(),
		}),
	),
});

export const paymentListSchema = z.strictObject({
	items: z.array(paymentSchema).max(50),
	nextCursor: databaseIdSchema.nullable(),
});

export const paymentInputSchema = z
	.strictObject({
		memberId: databaseIdSchema,
		subscriptionId: databaseIdSchema,
		amount: z.number().int().min(1, 'Enter an amount greater than zero.').max(1_000_000_000),
		method: paymentMethodSchema,
		occurredAt: z.iso.datetime(),
		providerReference: z.string().trim().max(120).optional(),
		note: z.string().trim().max(500).optional(),
		idempotencyKey: z.uuid(),
	})
	.superRefine((value, context) => {
		if (value.method !== 'CASH' && !value.providerReference) {
			context.addIssue({
				code: 'custom',
				path: ['providerReference'],
				message: 'Enter the provider reference.',
			});
		}
		if (value.method === 'CASH' && value.providerReference) {
			context.addIssue({
				code: 'custom',
				path: ['providerReference'],
				message: 'Cash payments do not use a provider reference.',
			});
		}
	});

/** One command creates a dated registration and its full-price payment. */
export const registerPaymentInputSchema = z
	.strictObject({
		memberId: databaseIdSchema.optional(),
		member: memberRegistrationInputSchema
			.omit({
				subscription: true,
				idempotencyKey: true,
			})
			.optional(),
		subscription: memberSubscriptionInputSchema,
		method: paymentMethodSchema,
		occurredAt: z.iso.datetime(),
		providerReference: z.string().trim().max(120).optional(),
		note: z.string().trim().max(500).optional(),
		idempotencyKey: z.uuid(),
	})
	.superRefine((value, context) => {
		if ((value.memberId === undefined) === (value.member === undefined)) {
			context.addIssue({
				code: 'custom',
				path: ['memberId'],
				message: 'Choose an existing member or enter a new member.',
			});
		}
		if (value.method !== 'CASH' && !value.providerReference) {
			context.addIssue({
				code: 'custom',
				path: ['providerReference'],
				message: 'Enter the provider reference.',
			});
		}
		if (value.method === 'CASH' && value.providerReference) {
			context.addIssue({
				code: 'custom',
				path: ['providerReference'],
				message: 'Cash payments do not use a provider reference.',
			});
		}
	});

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentList = z.infer<typeof paymentListSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentOrder = z.infer<typeof paymentOrderSchema>;
export type PaymentInput = z.infer<typeof paymentInputSchema>;
export type RegisterPaymentInput = z.output<typeof registerPaymentInputSchema>;
