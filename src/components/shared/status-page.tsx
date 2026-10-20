import { AlertCircleIcon, ArrowRight01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

import { LogoutButton } from '@/components/auth/logout-button';
import { routes } from '@/constants/routes';

import { Button } from './button';
import styles from './status-page.module.css';

type StatusCode = 401 | 403 | 404 | 429 | 500 | 503;

interface StatusContent {
	readonly title: string;
	readonly description: string;
	readonly action?: string;
	readonly href?: string;
}

const states: Record<StatusCode, StatusContent> = {
	401: {
		title: 'Sign in required',
		description: 'Sign in to continue to your gym portal.',
		action: 'Go to sign in',
		href: routes.login,
	},
	403: {
		title: 'Access not available',
		description:
			'This account does not have access to the requested gym page. Sign out to use another account.',
	},
	404: {
		title: 'Page not found',
		description: 'This address does not lead to a page in your gym portal.',
		action: 'Return to dashboard',
		href: routes.dashboard,
	},
	429: {
		title: 'Too many requests',
		description: 'Please wait a moment before trying again.',
		action: 'Return to dashboard',
		href: routes.dashboard,
	},
	500: {
		title: 'Something went wrong',
		description: 'We could not open this page. Please try again.',
		action: 'Return to dashboard',
		href: routes.dashboard,
	},
	503: {
		title: 'Service temporarily unavailable',
		description: 'The portal could not complete this request. Please try again shortly.',
		action: 'Return to dashboard',
		href: routes.dashboard,
	},
};

interface StatusPageProps {
	readonly status: StatusCode;
	readonly onRetry?: () => void;
}

export function StatusPage({ status, onRetry }: StatusPageProps) {
	const state = states[status];

	return (
		<main id="main" className={styles.main}>
			<section className={styles.content} aria-labelledby="status-title">
				<div className={styles.marker} aria-hidden="true">
					<HugeiconsIcon icon={AlertCircleIcon} size={27} strokeWidth={1.6} />
				</div>
				<p className={styles.code}>ERROR {status}</p>
				<h1 id="status-title">{state.title}</h1>
				<p className={styles.description}>{state.description}</p>
				<div className={styles.actions}>
					{onRetry ? (
						<Button icon={RefreshIcon} onClick={onRetry}>
							Try again
						</Button>
					) : null}
					{status === 403 ? <LogoutButton /> : null}
					{state.href && state.action ? (
						<Link
							href={state.href}
							prefetch={false}
							className={onRetry ? styles.secondaryAction : styles.primaryAction}
						>
							{state.action}
							<HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
						</Link>
					) : null}
				</div>
			</section>
		</main>
	);
}
