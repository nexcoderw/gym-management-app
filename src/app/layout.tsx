import type { Metadata } from 'next';

import { bodyFont, headingFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
	title: { default: 'NEXCODE Gym Portal', template: '%s | NEXCODE Gym Portal' },
	description: 'Secure organization access for NEXCODE Gym owners.',
	robots: { index: false, follow: false },
	referrer: 'no-referrer',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
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
