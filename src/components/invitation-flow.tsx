'use client';

import {
	ArrowRight01Icon,
	CheckmarkCircle01Icon,
	LockPasswordIcon,
	UserAdd01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import styles from './invitation-flow.module.css';

type Challenge = {
	nextStep: 'sign_in' | 'register';
	challengeToken: string;
	expiresAt: string;
	organizationName: string;
	organizationStatus: string;
};
type Stage = 'reading' | 'identity' | 'accept' | 'complete' | 'error';

export function InvitationFlow() {
	const router = useRouter();
	const started = useRef(false);
	const [stage, setStage] = useState<Stage>('reading');
	const [challenge, setChallenge] = useState<Challenge | null>(null);
	const [message, setMessage] = useState('Verifying your secure invitation…');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
		window.history.replaceState(null, '', window.location.pathname);
		void beginEnrollment(token)
			.then((data) => {
				setChallenge(data);
				setStage('identity');
			})
			.catch((error: unknown) => {
				setMessage(toMessage(error));
				setStage('error');
			});
	}, []);

	async function authenticate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!challenge) return;
		setBusy(true);
		setMessage('');
		const form = new FormData(event.currentTarget);
		try {
			const endpoint =
				challenge.nextStep === 'register' ? '/api/enrollment/register' : '/api/enrollment/verify';
			const body =
				challenge.nextStep === 'register'
					? {
							challengeToken: challenge.challengeToken,
							displayName: form.get('displayName'),
							password: form.get('password'),
						}
					: { challengeToken: challenge.challengeToken, password: form.get('password') };
			await post(endpoint, body);
			setStage('accept');
		} catch (error: unknown) {
			setMessage(toMessage(error));
		} finally {
			setBusy(false);
		}
	}

	async function accept() {
		if (!challenge) return;
		setBusy(true);
		setMessage('');
		try {
			await post('/api/enrollment/accept', { challengeToken: challenge.challengeToken });
			setStage('complete');
		} catch (error: unknown) {
			setMessage(toMessage(error));
		} finally {
			setBusy(false);
		}
	}

	if (stage === 'reading')
		return (
			<Panel eyebrow="Secure invitation">
				<Loading />
				<h1>Checking your invitation</h1>
				<p>{message}</p>
			</Panel>
		);
	if (stage === 'error')
		return (
			<Panel eyebrow="Invitation unavailable">
				<h1>We couldn’t verify this invitation</h1>
				<p>{message}</p>
				<a className={styles.secondary} href="/login">
					Open owner sign in
				</a>
			</Panel>
		);
	if (stage === 'complete')
		return (
			<Panel eyebrow="Ownership confirmed">
				<HugeiconsIcon icon={CheckmarkCircle01Icon} size={38} color="var(--success)" />
				<h1>Your gym ownership invitation has been accepted.</h1>
				<p>Your organization access is ready. Continue to the portal using your owner account.</p>
				<button className={styles.primary} onClick={() => router.replace('/dashboard')}>
					Open gym portal <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
				</button>
			</Panel>
		);

	return (
		<Panel eyebrow={stage === 'identity' ? 'Identity verification' : 'Final confirmation'}>
			<div className={styles.pass}>
				<span>GYM ACCESS</span>
				<strong>{challenge?.organizationName}</strong>
				<small>
					{challenge?.organizationStatus === 'PENDING'
						? 'Awaiting NEXCODE activation'
						: 'Active organization'}
				</small>
			</div>
			{stage === 'identity' ? (
				<form onSubmit={authenticate} className={styles.form}>
					<HugeiconsIcon
						icon={challenge?.nextStep === 'register' ? UserAdd01Icon : LockPasswordIcon}
						size={28}
						color="var(--navy)"
					/>
					<h1>
						{challenge?.nextStep === 'register'
							? 'Create your owner account'
							: 'Confirm your account'}
					</h1>
					<p>
						{challenge?.nextStep === 'register'
							? 'Set up the identity you will use to manage this gym.'
							: 'Enter your password to prove this invitation belongs to you.'}
					</p>
					{challenge?.nextStep === 'register' && (
						<label>
							Full name
							<input
								name="displayName"
								autoComplete="name"
								minLength={2}
								maxLength={120}
								required
							/>
						</label>
					)}
					<label>
						Password
						<input
							name="password"
							type="password"
							autoComplete={
								challenge?.nextStep === 'register' ? 'new-password' : 'current-password'
							}
							minLength={challenge?.nextStep === 'register' ? 12 : 1}
							maxLength={1024}
							required
						/>
					</label>
					{message && (
						<p role="alert" className={styles.error}>
							{message}
						</p>
					)}
					<button className={styles.primary} disabled={busy}>
						{busy ? 'Verifying…' : 'Continue'} <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
					</button>
				</form>
			) : (
				<div className={styles.form}>
					<h1>Accept owner access</h1>
					<p>
						You will become an owner of <strong>{challenge?.organizationName}</strong>. Organization
						operations remain limited until NEXCODE activates a pending gym.
					</p>
					{message && (
						<p role="alert" className={styles.error}>
							{message}
						</p>
					)}
					<button className={styles.primary} disabled={busy} onClick={accept}>
						{busy ? 'Accepting…' : 'Accept invitation'}{' '}
						<HugeiconsIcon icon={ArrowRight01Icon} size={17} />
					</button>
				</div>
			)}
		</Panel>
	);
}

function Panel({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
	return (
		<section className={styles.panel}>
			<span className={styles.eyebrow}>{eyebrow}</span>
			{children}
		</section>
	);
}
function Loading() {
	return <span className={styles.loader} aria-hidden="true" />;
}
function beginEnrollment(token: string | null): Promise<Challenge> {
	if (token === null) {
		return Promise.reject(new Error('This invitation link is incomplete or no longer valid.'));
	}
	return post<Challenge>('/api/enrollment/start', { invitationToken: token });
}
async function post<T = unknown>(url: string, body: unknown): Promise<T> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = (await response.json()) as { message?: string };
	if (!response.ok) throw new Error(data.message ?? 'The request could not be completed.');
	return data as T;
}
function toMessage(error: unknown) {
	return error instanceof Error ? error.message : 'The request could not be completed.';
}
