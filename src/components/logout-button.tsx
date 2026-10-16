'use client';

import { Logout01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './logout-button.module.css';

export function LogoutButton() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	return (
		<button
			className={styles.button}
			disabled={busy}
			onClick={async () => {
				setBusy(true);
				try {
					await fetch('/api/auth/logout', { method: 'POST' });
				} finally {
					router.replace('/login');
					router.refresh();
				}
			}}
		>
			{busy ? 'Signing out…' : 'Sign out'}
			<HugeiconsIcon icon={Logout01Icon} size={16} />
		</button>
	);
}
