import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** A request nonce permits Next's hydration payload without allowing arbitrary inline scripts. */
export function proxy(request: NextRequest): NextResponse {
	const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
	const development = process.env.NODE_ENV === 'development';
	const policy = [
		"default-src 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"object-src 'none'",
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
		`style-src 'self' ${development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
		"img-src 'self' data:",
		"font-src 'self' data:",
		`connect-src 'self'${development ? ' ws:' : ''}`,
	].join('; ');
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-nonce', nonce);
	requestHeaders.set('Content-Security-Policy', policy);
	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set('Content-Security-Policy', policy);
	return response;
}

export const config = {
	matcher: [
		{
			// Framework assets and the development HMR endpoint do not need a page nonce.
			source: '/((?!api|_next|favicon.ico).*)',
			missing: [
				{ type: 'header', key: 'next-router-prefetch' },
				{ type: 'header', key: 'purpose', value: 'prefetch' },
			],
		},
	],
};
