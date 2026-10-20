'use client';

import { Cancel01Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/shared/button';
import { Dialog } from '@/components/shared/dialog';
import { Input } from '@/components/shared/input';
import {
	manualReminderInputSchema,
	type ManualReminderInput,
	type UpcomingReminderItem,
} from '@/lib/contracts';

import styles from './reminder-compose-dialog.module.css';

export function ReminderComposeDialog({
	member,
	pending,
	onClose,
	onSend,
}: {
	readonly member: UpcomingReminderItem;
	readonly pending: boolean;
	readonly onClose: () => void;
	readonly onSend: (input: ManualReminderInput) => Promise<void>;
}) {
	const [subject, setSubject] = useState(`Your ${member.planName} membership is ending soon`);
	const [body, setBody] = useState(
		`Hello ${member.memberName},\n\nYour ${member.planName} membership ends on ${member.endDate}. If you would like to renew, please contact us at the gym.\n\nWe look forward to seeing you!`,
	);
	const [errors, setErrors] = useState<{ subject?: string; body?: string }>({});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending) return;
		const parsed = manualReminderInputSchema.safeParse({
			subject: subject.trim(),
			body: body.trim(),
		});
		if (!parsed.success) {
			setErrors({
				subject: parsed.error.issues.some((issue) => issue.path[0] === 'subject')
					? 'Enter a subject of 1–120 characters without line breaks.'
					: undefined,
				body: parsed.error.issues.some((issue) => issue.path[0] === 'body')
					? 'Enter a message of 1–2,000 characters.'
					: undefined,
			});
			return;
		}
		setErrors({});
		void onSend(parsed.data);
	}

	return (
		<Dialog
			open
			title="Send email reminder"
			description={`Review the email for ${member.memberName}. Only one manual reminder can be sent for this membership.`}
			onClose={() => {
				if (!pending) onClose();
			}}
		>
			<form className={styles.form} onSubmit={submit}>
				<Input
					icon={Mail01Icon}
					label="Subject"
					value={subject}
					maxLength={120}
					error={errors.subject}
					onChange={(event) => setSubject(event.target.value)}
				/>
				<div className={styles.field}>
					<label htmlFor="reminder-message">Message</label>
					<textarea
						id="reminder-message"
						value={body}
						maxLength={2000}
						rows={8}
						aria-invalid={errors.body ? true : undefined}
						aria-describedby={errors.body ? 'reminder-message-error' : undefined}
						onChange={(event) => setBody(event.target.value)}
					/>
					{errors.body ? (
						<p id="reminder-message-error" role="alert" className={styles.error}>
							{errors.body}
						</p>
					) : null}
				</div>
				<p className={styles.note}>
					Sending queues this email for delivery from your gym via Mucyora. Provider acceptance
					 does not confirm inbox delivery.
				</p>
				<div className={styles.actions}>
					<Button icon={Cancel01Icon} variant="secondary" disabled={pending} onClick={onClose}>
						Cancel
					</Button>
					<Button icon={Mail01Icon} type="submit" pending={pending}>
						Send email
					</Button>
				</div>
			</form>
		</Dialog>
	);
}
