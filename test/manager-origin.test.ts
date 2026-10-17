import { describe, expect, it } from 'vitest';

import { tenantOriginFromHost } from '@/lib/server/manager-origin';

describe('production manager tenant hosts', () => {
	it.each(['soho', 'diamondgym', 'kigali-strength-club'])(
		'builds the exact origin for a valid organization slug: %s',
		(slug) => {
			expect(tenantOriginFromHost(`${slug}.mucyora.rw`, 'mucyora.rw')).toBe(
				`https://${slug}.mucyora.rw`,
			);
		},
	);

	it('normalizes DNS host casing before deriving the origin', () => {
		expect(tenantOriginFromHost('SOHO.MUCYORA.RW', 'MUCYORA.RW')).toBe('https://soho.mucyora.rw');
	});

	it.each([
		'mucyora.rw',
		'admin.mucyora.rw',
		'api.mucyora.rw',
		'branch.soho.mucyora.rw',
		'soho.mucyora.rw.attacker.example',
		'soho.mucyora.rw:443',
	])('rejects an invalid or reserved tenant host: %s', (host) => {
		expect(tenantOriginFromHost(host, 'mucyora.rw')).toBeNull();
	});
});
