'use client';

import { StatusPage } from '@/components/shared/status-page';

export default function ErrorPage({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<StatusPage status={500} onRetry={reset} />
	);
}
