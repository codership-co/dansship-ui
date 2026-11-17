import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { PromotionBanner } from './promotion-banner';

import '@core/i18n';

import type { PlanPromotion } from '@core/api';

const promotion: PlanPromotion = {
  code: 'BLACK_FRIDAY_2026',
  label_key: 'subscriptions:discountBlackFriday',
  discount_percentage: 30,
  discount_modes: ['monthly'],
  original_price: 230000,
  promotional_price: 161000,
  start_rule: 'on_approval',
  terms_required: false,
};

describe('PromotionBanner', () => {
  afterEach(cleanup);

  it('renders the promotion copy with the percentage from the API and links to the plans', () => {
    render(
      <MemoryRouter>
        <PromotionBanner promotion={promotion} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading')).toHaveTextContent('30 % de descuento en planes mensuales');
    expect(screen.getByText('Black Friday')).toBeInTheDocument();
    expect(screen.getByText('Solo por tiempo limitado.').tagName).toBe('STRONG');
    expect(screen.getByRole('link')).toHaveTextContent('Ver planes');
  });

  it('hides the button when the banner sits on the plans page itself', () => {
    render(
      <MemoryRouter>
        <PromotionBanner promotion={promotion} hideCta />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
