'use client';

import { ShieldKeyIcon, LockPasswordIcon, Mail01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import styles from './login-form.module.css';

export function LoginForm() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (busy) return;
		setBusy(true);
		setMessage('');
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});
			const body = (await response.json()) as { message?: string };
			if (!response.ok) throw new Error(body.message ?? 'Sign-in could not be completed.');
			router.replace('/dashboard');
			router.refresh();
		} catch (error: unknown) {
			setMessage(error instanceof Error ? error.message : 'Sign-in could not be completed.');
		} finally {
			setPassword('');
			setBusy(false);
		}
	}

	return (
		<form className={styles.form} onSubmit={submit}>
			<div className={styles.heading}>
				<h1>Welcome back</h1>
				<p>Sign in with the owner account connected to your gym.</p>
			</div>
			<div className={styles.fields}>
				<Input
					id="owner-email"
					name="email"
					label="Email address"
					icon={Mail01Icon}
					type="email"
					autoComplete="username"
					placeholder="owner@example.com"
					maxLength={254}
					value={email}
					onChange={(event) => setEmail(event.currentTarget.value)}
					required
				/>
				<Input
					id="owner-password"
					name="password"
					label="Password"
					icon={LockPasswordIcon}
					type="password"
					autoComplete="current-password"
					placeholder="Enter your password"
					maxLength={1024}
					value={password}
					onChange={(event) => setPassword(event.currentTarget.value)}
					required
				/>
			</div>
			{message && (
				<p className={styles.error} role="alert">
					{message}
				</p>
			)}
			<Button type="submit" icon={ShieldKeyIcon} width="full" pending={busy}>
				Sign in securely
			</Button>
		</form>
	);
}
