'use client';

import { Logout01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/shared/button';
import { routes } from '@/constants/routes';
import styles from './logout-button.module.css';

export function LogoutButton() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	async function signOut() {
		if (busy) return;
		setBusy(true);
		setError('');
		try {
			const response = await fetch('/api/auth/logout', { method: 'POST' });
			if (!response.ok) {
				const body = (await response.json().catch(() => ({}))) as { message?: string };
				throw new Error(body.message ?? 'Sign-out could not be completed.');
			}
			router.replace(routes.login);
			router.refresh();
		} catch (failure: unknown) {
			setError(failure instanceof Error ? failure.message : 'Sign-out failed. Try again.');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className={styles.container}>
			<Button
				variant="secondary"
				icon={Logout01Icon}
				width="small"
				pending={busy}
				onClick={signOut}
			>
				Sign out
			</Button>
			{error ? (
				<p role="alert" className={styles.error}>
					{error}
				</p>
			) : null}
		</div>
	);
}
