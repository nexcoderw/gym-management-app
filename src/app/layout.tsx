import type { Metadata } from 'next';
import { connection } from 'next/server';

import { bodyFont, headingFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
	title: { default: 'Gym owner portal', template: '%s | Gym owner portal' },
	description: 'Secure organization access for gym owners.',
	robots: { index: false, follow: false },
	referrer: 'no-referrer',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
	// Nonce-bearing framework scripts require request-time rendering.
	await connection();
	return (
		<html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
			<body>
				<a className="skip-link" href="#main">
					Skip to content
				</a>
				{children}
			</body>
		</html>
	);
}
