'use client';

import { StatusPage } from '@/components/shared/status-page';

import { bodyFont, headingFont } from './fonts';
import './globals.css';

export default function GlobalError({
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
			<body>
				<StatusPage status={500} onRetry={retry} />
			</body>
		</html>
	);
}
