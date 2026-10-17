import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxy } from '@/proxy';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('manager content security policy', () => {
	it('uses a distinct nonce for each rendered page request', () => {
		vi.stubEnv('NODE_ENV', 'production');
		const request = new NextRequest('https://manager.example.invalid/invitations/accept');
		const first = proxy(request).headers.get('content-security-policy');
		const second = proxy(request).headers.get('content-security-policy');
		const firstNonce = first?.match(/script-src[^;]*'nonce-([^']+)'/u)?.[1];
		const secondNonce = second?.match(/script-src[^;]*'nonce-([^']+)'/u)?.[1];

		expect(firstNonce).toBeTruthy();
		expect(secondNonce).toBeTruthy();
		expect(firstNonce).not.toBe(secondNonce);
		expect(first).toContain("script-src 'self'");
		expect(first).toContain("'strict-dynamic'");
		expect(first).not.toContain("script-src 'self' 'unsafe-inline'");
	});
});
