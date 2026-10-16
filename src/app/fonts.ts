import { Albert_Sans, DM_Sans } from 'next/font/google';

export const headingFont = Albert_Sans({
	subsets: ['latin'],
	variable: '--font-heading',
	display: 'swap',
});
export const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
