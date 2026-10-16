'use client';

import { ArrowRight01Icon, LockPasswordIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import styles from './login-form.module.css';

export function LoginForm() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setMessage('');
		const form = new FormData(event.currentTarget);
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
			});
			const body = (await response.json()) as { message?: string };
			if (!response.ok) throw new Error(body.message ?? 'Sign-in could not be completed.');
			router.replace('/dashboard');
			router.refresh();
		} catch (error: unknown) {
			setMessage(error instanceof Error ? error.message : 'Sign-in could not be completed.');
		} finally {
			setBusy(false);
		}
	}
	return (
		<form className={styles.form} onSubmit={submit}>
			<HugeiconsIcon icon={LockPasswordIcon} size={30} color="var(--navy)" />
			<span>OWNER SIGN IN</span>
			<h1>Welcome back</h1>
			<p>Use the owner identity connected to your gym membership.</p>
			<label>
				Email address
				<input name="email" type="email" autoComplete="email" maxLength={254} required />
			</label>
			<label>
				Password
				<input
					name="password"
					type="password"
					autoComplete="current-password"
					maxLength={1024}
					required
				/>
			</label>
			{message && (
				<p className={styles.error} role="alert">
					{message}
				</p>
			)}
			<button disabled={busy}>
				{busy ? 'Signing in…' : 'Sign in'}
				<HugeiconsIcon icon={ArrowRight01Icon} size={17} />
			</button>
		</form>
	);
}
