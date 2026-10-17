// @vitest-environment jsdom
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InvitationFlow } from '@/components/invitation-flow';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const fetchMock = vi.fn<typeof fetch>();
const invitationToken = 'a'.repeat(43);

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	window.history.replaceState(null, '', `/invitations/accept#token=${invitationToken}`);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('owner invitation handoff', () => {
	it('retains the fragment token across strict effect replay and leaves loading', async () => {
		fetchMock.mockImplementation(async () =>
			Response.json({
				nextStep: 'register',
				challengeToken: 'b'.repeat(43),
				expiresAt: '2030-01-01T00:10:00.000Z',
				organizationName: 'Kigali Strength Club',
				organizationStatus: 'PENDING',
			}),
		);

		render(
			<StrictMode>
				<InvitationFlow />
			</StrictMode>,
		);

		expect(await screen.findByRole('heading', { name: 'Create your owner account' })).toBeTruthy();
		expect(window.location.hash).toBe('');
		expect(fetchMock).toHaveBeenCalledOnce();
		for (const [path, init] of fetchMock.mock.calls) {
			expect(path).toBe('/api/enrollment/start');
			expect(init).toMatchObject({
				method: 'POST',
				credentials: 'same-origin',
				cache: 'no-store',
				redirect: 'error',
			});
			expect(init?.body).toBe(JSON.stringify({ invitationToken }));
		}
	});

	it('shows a stable recovery state when the invitation fragment is missing', async () => {
		window.history.replaceState(null, '', '/invitations/accept');
		render(<InvitationFlow />);
		expect(
			await screen.findByRole('heading', { name: 'We couldn’t verify this invitation' }),
		).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('retries a temporary service failure without requiring the removed fragment', async () => {
		fetchMock
			.mockResolvedValueOnce(
				Response.json({ message: 'The service is temporarily unavailable.' }, { status: 503 }),
			)
			.mockResolvedValueOnce(
				Response.json({
					nextStep: 'register',
					challengeToken: 'b'.repeat(43),
					expiresAt: '2030-01-01T00:10:00.000Z',
					organizationName: 'Kigali Strength Club',
					organizationStatus: 'PENDING',
				}),
			);

		render(<InvitationFlow />);
		fireEvent.click(await screen.findByRole('button', { name: 'Try invitation again' }));

		expect(await screen.findByRole('heading', { name: 'Create your owner account' })).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		for (const [, init] of fetchMock.mock.calls) {
			expect(init?.body).toBe(JSON.stringify({ invitationToken }));
		}
	});
});
