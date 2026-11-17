import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PlanCard } from './plan-card';

import '@core/i18n';

import type { PublicPlan } from '@core/api';

const basePlan: PublicPlan = {
  id: 'plan-1',
  name: 'Floreciendo Impulso',
  description: 'Acceso a 8 clases.',
  price: 230000,
  currency: 'COP',
  classes_included: 8,
  validity_days: 30,
  features: ['8 clases incluidas'],
};

const promotionalPlan: PublicPlan = {
  ...basePlan,
  promotion: {
    code: 'BLACK_FRIDAY_2026',
    label_key: 'subscriptions:discountBlackFriday',
    discount_percentage: 30,
    discount_modes: ['monthly'],
    original_price: 230000,
    promotional_price: 161000,
    start_rule: 'on_approval',
    terms_required: false,
  },
};

describe('PlanCard promotion', () => {
  afterEach(cleanup);

  it('shows the badge, the struck-through original price and the promotional price while the API says so', () => {
    render(<PlanCard plan={promotionalPlan} />);

    expect(screen.getByText('Black Friday −30 %')).toBeInTheDocument();
    expect(screen.getByText(/161\.000/)).toBeInTheDocument();

    const original = screen.getByText(/230\.000/);

    expect(original).toHaveClass('line-through');
  });

  it('takes the percentage from the API, never from the copy', () => {
    render(
      <PlanCard plan={{ ...promotionalPlan, promotion: { ...promotionalPlan.promotion!, discount_percentage: 25 } }} />,
    );

    expect(screen.getByText('Black Friday −25 %')).toBeInTheDocument();
  });

  it('falls back to the generic copy for a promotion without its own text', () => {
    render(
      <PlanCard plan={{ ...promotionalPlan, promotion: { ...promotionalPlan.promotion!, code: 'OTHER_PROMO' } }} />,
    );

    expect(screen.getByText('Promoción −30 %')).toBeInTheDocument();
  });

  it('is exactly the normal card when there is no promotion', () => {
    render(<PlanCard plan={basePlan} />);

    expect(screen.queryByText(/Black Friday/)).not.toBeInTheDocument();
    expect(screen.getByText(/230\.000/)).not.toHaveClass('line-through');
  });
});
