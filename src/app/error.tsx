'use client';

import { StatusPage } from '@/components/shared/status-page';

export default function ErrorPage({
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return <StatusPage status={500} onRetry={retry} />;
}
