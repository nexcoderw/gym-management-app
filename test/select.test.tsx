// @vitest-environment jsdom
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Select } from '@/components/shared/select';

afterEach(cleanup);

describe('shared select', () => {
	it('associates its label and inline error with the native control', () => {
		render(
			<Select label="Duration" icon={Calendar03Icon} error="Choose a duration." defaultValue="">
				<option value="">Choose duration</option>
				<option value="MONTHS">Months</option>
			</Select>,
		);

		const select = screen.getByLabelText('Duration');
		const error = screen.getByRole('alert');

		expect(select.getAttribute('aria-invalid')).toBe('true');
		expect(select.getAttribute('aria-describedby')).toBe(error.id);
		expect(error.textContent).toBe('Choose a duration.');
	});
});
