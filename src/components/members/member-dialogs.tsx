'use client';

import { Archive02Icon, Cancel01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/shared/button';
import { Dialog } from '@/components/shared/dialog';
import { routes } from '@/constants/routes';
import { memberRegistrationResponseSchema, memberSchema, type Member } from '@/lib/contracts';
import { MemberForm, type MemberFormDraft } from './member-form';
import { MemberHistory } from './member-history';
import { MemberPreview } from './member-preview';
import { memberRequest } from './member-requests';
import styles from './member-form.module.css';

export type MemberDialogState =
	| { readonly kind: 'create' }
	| { readonly kind: 'details' | 'edit' | 'archive'; readonly member: Member };

export function MemberDialogs({
	selection,
	onClose,
	onSaved,
	notify,
}: {
	readonly selection: MemberDialogState;
	readonly onClose: () => void;
	readonly onSaved: (member: Member | null) => void;
	readonly notify: (message: string, tone: 'success' | 'error') => void;
}) {
	const id = selection.kind === 'create' ? null : selection.member.id;
	const [member, setMember] = useState<Member | null>(null);
	const [pending, setPending] = useState(false);
	const [loading, setLoading] = useState(id !== null);
	const [failure, setFailure] = useState<string | null>(null);
	const [retry, setRetry] = useState(0);
	const live = useRef(true);
	const inFlight = useRef(false);

	useEffect(() => {
		live.current = true;
		const controller = new AbortController();
		if (id !== null) {
			void memberRequest(routes.memberApi(id), memberSchema, { signal: controller.signal })
				.then((result) => {
					if (!controller.signal.aborted) {
						setMember(result);
						setFailure(null);
						setLoading(false);
					}
				})
				.catch(() => {
					if (!controller.signal.aborted) {
						setFailure('The latest profile could not be loaded. Retry before making changes.');
						setLoading(false);
					}
				});
		}
		return () => {
			live.current = false;
			controller.abort();
		};
	}, [id, retry]);

	const close = () => {
		if (!inFlight.current) onClose();
	};
	async function mutate(operation: () => Promise<Member | null>, message: string) {
		if (inFlight.current) return;
		inFlight.current = true;
		setPending(true);
		setFailure(null);
		try {
			const result = await operation();
			if (!live.current) return;
			notify(message, 'success');
			onSaved(result);
		} catch (error: unknown) {
			if (!live.current) return;
			const message =
				error instanceof Error ? error.message : 'The request could not be confirmed. Try again.';
			setFailure(message);
			notify(message, 'error');
		} finally {
			inFlight.current = false;
			if (live.current) setPending(false);
		}
	}

	async function save(draft: MemberFormDraft) {
		await mutate(
			async () => {
				if (selection.kind === 'create') {
					const result = await memberRequest(routes.membersApi, memberRegistrationResponseSchema, {
						method: 'POST',
						body: JSON.stringify(draft),
					});
					return result.member;
				}
				if (member === null) throw new Error('Reload the member before editing.');
				return await memberRequest(routes.memberApi(member.id), memberSchema, {
					method: 'PATCH',
					body: JSON.stringify({
						name: draft.name,
						phoneNumber: draft.phoneNumber,
						email: draft.email,
						updatedAt: member.updatedAt,
					}),
				});
			},
			selection.kind === 'create' ? 'Member added.' : 'Member updated.',
		);
	}

	if (selection.kind === 'details' && member !== null)
		return (
			<MemberPreview key={member.id} member={member} onClose={close}>
				<MemberHistory memberId={member.id} />
			</MemberPreview>
		);

	return (
		<Dialog
			open
			title={
				selection.kind === 'create'
					? 'Add member'
					: selection.kind === 'edit'
						? 'Edit member'
						: selection.kind === 'archive'
							? 'Archive member'
							: 'Member details'
			}
			onClose={close}
		>
			<div className={styles.form}>
				{failure ? (
					<p role="alert" className={styles.error}>
						{failure}
					</p>
				) : null}
				{id !== null && member === null ? (
					<>
						{failure ? (
							<Button
								icon={RefreshIcon}
								pending={loading}
								onClick={() => {
									setLoading(true);
									setRetry((value) => value + 1);
								}}
							>
								Retry profile
							</Button>
						) : (
							<p role="status">Loading latest profile…</p>
						)}
					</>
				) : selection.kind === 'archive' && member !== null ? (
					<>
						<p>
							Archive <strong>{member.name}</strong>? The profile moves out of the active registry.
							Plan history and reserved name/phone details are retained.
						</p>
						<p className={styles.hint}>
							Current and future registrations must be cancelled first. This does not delete records
							or process refunds.
						</p>
						<div className={styles.actions}>
							<Button icon={Cancel01Icon} variant="secondary" disabled={pending} onClick={close}>
								Keep member
							</Button>
							<Button
								icon={Archive02Icon}
								variant="danger"
								pending={pending}
								onClick={() =>
									void mutate(async () => {
										await memberRequest(routes.memberApi(member.id), z.undefined(), {
											method: 'DELETE',
											body: JSON.stringify({ updatedAt: member.updatedAt }),
										});
										return null;
									}, 'Member archived.')
								}
							>
								Archive member
							</Button>
						</div>
					</>
				) : selection.kind === 'create' ||
				  (selection.kind === 'edit' && member !== null && member.status === 'ACTIVE') ? (
					<MemberForm
						member={member ?? undefined}
						pending={pending}
						onSubmit={save}
						onCancel={close}
					/>
				) : (
					<p>Archived members cannot be edited.</p>
				)}
			</div>
		</Dialog>
	);
}
