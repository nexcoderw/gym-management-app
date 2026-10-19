// @vitest-environment jsdom

import { PackageAdd01Icon } from '@hugeicons/core-free-icons';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ButtonLink } from '@/components/shared/button';
import { EmptyState } from '@/components/shared/empty-state';

afterEach(cleanup);

describe('shared empty state', () => {
	it('renders a decorative icon, heading, description, and feature-owned action', () => {
		const { container } = render(
			<EmptyState
				icon={PackageAdd01Icon}
				title="Create your first membership"
				description="Start with a name and price."
				action={
					<ButtonLink href="/memberships" icon={PackageAdd01Icon} variant="primary">
						Add membership
					</ButtonLink>
				}
			/>,
		);

		expect(
			screen.getByRole('heading', { level: 2, name: 'Create your first membership' }),
		).toBeTruthy();
		expect(screen.getByText('Start with a name and price.')).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Add membership' }).getAttribute('href')).toBe(
			'/memberships',
		);
		expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
	});

	it('announces an error when the caller requests an alert', () => {
		render(
			<EmptyState
				icon={PackageAdd01Icon}
				title="Memberships unavailable"
				description="Try again shortly."
				role="alert"
			/>,
		);

		expect(screen.getByRole('alert')).toBeTruthy();
	});
});
