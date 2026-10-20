// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentReportDownload } from '@/components/reports/payment-report-download';

const fetchMock = vi.fn<typeof fetch>();
const createObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const revokeObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
const props = {
	href: '/api/reports/payments/pdf?fromDate=2026-01-01&toDate=2026-01-31',
	fromDate: '2026-01-01',
	toDate: '2026-01-31',
};

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	if (createObjectURLDescriptor)
		Object.defineProperty(URL, 'createObjectURL', createObjectURLDescriptor);
	else Reflect.deleteProperty(URL, 'createObjectURL');
	if (revokeObjectURLDescriptor)
		Object.defineProperty(URL, 'revokeObjectURL', revokeObjectURLDescriptor);
	else Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('payment report download', () => {
	it('downloads a PDF through the same-origin route', async () => {
		const createObjectURL = vi.fn(() => 'blob:fictional-report');
		const revokeObjectURL = vi.fn();
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		fetchMock.mockResolvedValueOnce(
			new Response(new TextEncoder().encode('%PDF-1.7'), {
				headers: { 'Content-Type': 'application/pdf' },
			}),
		);

		render(<PaymentReportDownload {...props} />);
		fireEvent.click(screen.getByRole('button', { name: 'Download full PDF' }));
		await waitFor(() => expect(click).toHaveBeenCalledOnce());
		expect(fetchMock.mock.calls[0]?.[0]).toBe(props.href);
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			cache: 'no-store',
			credentials: 'same-origin',
		});
		expect(createObjectURL).toHaveBeenCalledOnce();
	});

	it('asks for a shorter range when the export exceeds the backend limit', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ message: 'Too large' }, { status: 413 }));
		render(<PaymentReportDownload {...props} />);
		fireEvent.click(screen.getByRole('button', { name: 'Download full PDF' }));
		expect((await screen.findByRole('alert')).textContent).toContain('shorter date range');
	});
});
