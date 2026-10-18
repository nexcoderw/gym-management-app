'use client';

import {
	ArrowRight01Icon,
	CheckmarkCircle01Icon,
	LockPasswordIcon,
	RefreshIcon,
	Shield01Icon,
	UserAdd01Icon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { z } from 'zod';

import { Button, ButtonLink } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import {
	acceptedSchema,
	authenticatedSchema,
	enrollmentChallengeSchema,
	type EnrollmentChallenge,
} from '@/lib/contracts';
import styles from './invitation-flow.module.css';

type Stage = 'reading' | 'identity' | 'accept' | 'complete' | 'error';
const BROWSER_COMMAND_TIMEOUT_MS = 55_000;

export function InvitationFlow() {
	const router = useRouter();
	const invitationToken = useRef<string | null | undefined>(undefined);
	const enrollmentRequest = useRef<Promise<EnrollmentChallenge> | null>(null);
	const [stage, setStage] = useState<Stage>('reading');
	const [challenge, setChallenge] = useState<EnrollmentChallenge | null>(null);
	const [message, setMessage] = useState('Verifying your secure invitation…');
	const [busy, setBusy] = useState(false);
	const [passwordMismatch, setPasswordMismatch] = useState(false);
	const [retryAvailable, setRetryAvailable] = useState(false);

	useEffect(() => {
		let token = invitationToken.current;
		if (token === undefined) {
			token = new URLSearchParams(window.location.hash.slice(1)).get('token');
			invitationToken.current = token;
			window.history.replaceState(null, '', window.location.pathname);
		}
		enrollmentRequest.current ??= beginEnrollment(token);
		let active = true;
		void enrollmentRequest.current
			.then((data) => {
				if (!active) return;
				setChallenge(data);
				setStage('identity');
			})
			.catch((error: unknown) => {
				if (!active) return;
				setMessage(toMessage(error));
				setRetryAvailable(token !== null);
				setStage('error');
			});
		return () => {
			active = false;
		};
	}, []);

	async function retryEnrollment() {
		const token = invitationToken.current;
		if (token === undefined) return;
		setStage('reading');
		setMessage('Verifying your secure invitation…');
		setRetryAvailable(false);
		const request = beginEnrollment(token);
		enrollmentRequest.current = request;
		try {
			const data = await request;
			if (enrollmentRequest.current !== request) return;
			setChallenge(data);
			setStage('identity');
		} catch (error: unknown) {
			if (enrollmentRequest.current !== request) return;
			setMessage(toMessage(error));
			setRetryAvailable(token !== null);
			setStage('error');
		}
	}

	async function authenticate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!challenge || busy) return;
		const form = new FormData(event.currentTarget);
		if (challenge.nextStep === 'register' && form.get('password') !== form.get('confirmPassword')) {
			setPasswordMismatch(true);
			setMessage('Passwords do not match. Enter the same password in both fields.');
			return;
		}
		setPasswordMismatch(false);
		setBusy(true);
		setMessage('');
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
			await post(endpoint, body, authenticatedSchema);
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
			await post(
				'/api/enrollment/accept',
				{ challengeToken: challenge.challengeToken },
				acceptedSchema,
			);
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
				<div className={styles.actions}>
					{retryAvailable ? (
						<Button icon={RefreshIcon} width="full" onClick={retryEnrollment}>
							Try invitation again
						</Button>
					) : null}
					<ButtonLink href="/login" icon={LockPasswordIcon} width="full">
						Open owner sign in
					</ButtonLink>
				</div>
			</Panel>
		);
	if (stage === 'complete')
		return (
			<Panel eyebrow="Ownership confirmed">
				<span className={styles.successIcon} aria-hidden="true">
					<HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} />
				</span>
				<h1>Your gym ownership invitation has been accepted.</h1>
				<p>Your organization access is ready. Continue to the portal using your owner account.</p>
				<Button icon={ArrowRight01Icon} width="full" onClick={() => router.replace('/dashboard')}>
					Open gym portal
				</Button>
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
					<div className={styles.heading}>
						<span className={styles.headingIcon} aria-hidden="true">
							<HugeiconsIcon
								icon={challenge?.nextStep === 'register' ? UserAdd01Icon : LockPasswordIcon}
								size={24}
							/>
						</span>
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
					</div>
					{challenge?.nextStep === 'register' && (
						<Input
							id="owner-display-name"
							name="displayName"
							label="Full name"
							icon={UserIcon}
							autoComplete="name"
							placeholder="Your full name"
							minLength={1}
							maxLength={160}
							required
						/>
					)}
					<Input
						id="owner-identity-password"
						name="password"
						label="Password"
						icon={LockPasswordIcon}
						type="password"
						autoComplete={challenge?.nextStep === 'register' ? 'new-password' : 'current-password'}
						placeholder="Enter your password"
						minLength={12}
						maxLength={1024}
						required
					/>
					{challenge?.nextStep === 'register' && (
						<Input
							id="owner-confirm-password"
							name="confirmPassword"
							label="Confirm password"
							icon={LockPasswordIcon}
							type="password"
							autoComplete="new-password"
							placeholder="Enter your password again"
							minLength={12}
							maxLength={1024}
							required
							error={passwordMismatch ? message : undefined}
							onChange={() => setPasswordMismatch(false)}
						/>
					)}
					{message && !passwordMismatch && (
						<p id="owner-identity-error" role="alert" className={styles.error}>
							{message}
						</p>
					)}
					<Button type="submit" icon={ArrowRight01Icon} width="full" pending={busy}>
						Continue
					</Button>
				</form>
			) : (
				<div className={styles.form}>
					<div className={styles.heading}>
						<span className={styles.headingIcon} aria-hidden="true">
							<HugeiconsIcon icon={Shield01Icon} size={24} />
						</span>
						<h1>Accept owner access</h1>
						<p>
							You will become an owner of <strong>{challenge?.organizationName}</strong>.
							Organization operations remain limited until NEXCODE activates a pending gym.
						</p>
					</div>
					{message && (
						<p role="alert" className={styles.error}>
							{message}
						</p>
					)}
					<Button icon={ArrowRight01Icon} width="full" pending={busy} onClick={accept}>
						Accept invitation
					</Button>
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
function beginEnrollment(token: string | null): Promise<EnrollmentChallenge> {
	if (token === null) {
		return Promise.reject(new Error('This invitation link is incomplete or no longer valid.'));
	}
	return post('/api/enrollment/start', { invitationToken: token }, enrollmentChallengeSchema);
}
async function post<T>(
	url: `/api/enrollment/${'accept' | 'register' | 'start' | 'verify'}`,
	body: unknown,
	schema: z.ZodType<T>,
): Promise<T> {
	let response: Response;
	try {
		const deadline = AbortSignal.timeout(BROWSER_COMMAND_TIMEOUT_MS);
		response = await fetch(url, {
			method: 'POST',
			credentials: 'same-origin',
			cache: 'no-store',
			redirect: 'error',
			signal: deadline,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
	} catch {
		throw new Error('The service could not be reached. Try again.');
	}
	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new Error('The service returned an unexpected response. Try again.');
	}
	if (!response.ok) {
		const message =
			typeof data === 'object' &&
			data !== null &&
			'message' in data &&
			typeof data.message === 'string'
				? data.message
				: 'The request could not be completed.';
		throw new Error(message);
	}
	const parsed = schema.safeParse(data);
	if (!parsed.success) throw new Error('The service returned an unexpected response. Try again.');
	return parsed.data;
}
function toMessage(error: unknown) {
	return error instanceof Error ? error.message : 'The request could not be completed.';
}
