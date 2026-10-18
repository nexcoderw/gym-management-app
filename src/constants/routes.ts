export const routes = {
	home: '/',
	login: '/login',
	dashboard: '/dashboard',
	memberships: '/memberships',
	members: '/members',
	payments: '/payments',
	reminders: '/reminders',
	report: '/report',
	membershipPlansApi: '/api/membership-plans',
	membershipPlanApi: (planId: string) => `/api/membership-plans/${encodeURIComponent(planId)}`,
	membersApi: '/api/members',
} as const;
