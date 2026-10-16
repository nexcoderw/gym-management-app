import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	cacheComponents: false,
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'no-store' },
					{ key: 'Referrer-Policy', value: 'no-referrer' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
					{
						key: 'Content-Security-Policy',
						value:
							"default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'",
					},
				],
			},
		];
	},
};

export default nextConfig;
