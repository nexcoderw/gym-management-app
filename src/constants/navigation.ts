import {
	ChartLineData01Icon,
	CreditCardIcon,
	DashboardSquare01Icon,
	Notification01Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';

import { routes } from './routes';

export const navigation = [
	{
		key: 'dashboard',
		label: 'Dashboard',
		href: routes.dashboard,
		icon: DashboardSquare01Icon,
	},
	{
		key: 'members',
		label: 'Members',
		href: routes.members,
		icon: UserGroupIcon,
	},
	{
		key: 'payments',
		label: 'Payments',
		href: routes.payments,
		icon: CreditCardIcon,
	},
	{
		key: 'reminders',
		label: 'Reminders',
		href: routes.reminders,
		icon: Notification01Icon,
	},
	{
		key: 'report',
		label: 'Report',
		href: routes.report,
		icon: ChartLineData01Icon,
	},
] as const;

/** Exact or nested-path match, so similarly prefixed routes never activate each other. */
export function isCurrentDestination(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentDestination(pathname: string) {
	return navigation.find((item) => isCurrentDestination(pathname, item.href));
}
