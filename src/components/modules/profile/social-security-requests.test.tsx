import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SocialSecurityRequests } from './payment-document-files';

import '@core/i18n';

import type { SocialSecurityPeriodStatus } from '@core/api';

const pending: SocialSecurityPeriodStatus = {
  year: 2026,
  month: 7,
  required: true,
  uploaded: false,
  proof_year: 2026,
  proof_month: 7,
};

function renderSection(requests: Array<SocialSecurityPeriodStatus>) {
  const onUpload = vi.fn();
  const onView = vi.fn();
  const view = render(
    <SocialSecurityRequests
      requests={requests}
      isUploading={false}
      isOpeningFile={false}
      onUpload={onUpload}
      onView={onView}
    />,
  );

  return { ...view, onUpload, onView };
}

describe('SocialSecurityRequests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing without requests', () => {
    const { container } = renderSection([]);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the upload option for a pending request and sends the chosen file', () => {
    const { container, onUpload } = renderSection([pending]);

    expect(screen.getByText('Planilla de seguridad social de Julio 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subir archivo' })).toBeInTheDocument();

    const file = new File(['x'], 'planilla.pdf', { type: 'application/pdf' });

    fireEvent.change(container.querySelector('input[type=file]') as HTMLInputElement, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledWith(pending, file);
  });

  it('shows one card per requested month and the done state with a view action once uploaded', () => {
    const uploaded = { ...pending, month: 8, proof_month: 8, uploaded: true };
    const { onView } = renderSection([uploaded, pending]);

    expect(screen.getByText('Planilla de seguridad social de Agosto 2026')).toBeInTheDocument();
    expect(screen.getByText('Planilla de seguridad social de Julio 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver archivo' }));

    expect(onView).toHaveBeenCalledWith(uploaded);
  });
});
