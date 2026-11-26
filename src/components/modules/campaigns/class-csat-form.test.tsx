import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ClassCsatForm } from './class-csat-form';

import '@core/i18n';

import type { PendingCampaign } from '@core/api';

function campaign(deliveryContext: Record<string, unknown>): PendingCampaign {
  return {
    id: 'campaign-1',
    title: 'CSAT',
    kind: 'structured',
    structured_type: 'class_csat',
    questions: [],
    delivery_context: deliveryContext,
  } as PendingCampaign;
}

async function rateAndSubmit() {
  const [classStars, instructorStars] = [
    screen.getAllByRole('radio', { name: '¡Me encantó!' })[0],
    screen.getAllByRole('radio', { name: '¡Me encantó!' })[1],
  ];

  fireEvent.click(classStars);
  fireEvent.click(instructorStars);
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
}

describe('ClassCsatForm', () => {
  afterEach(cleanup);

  it('names the minor and sends the answer on their behalf', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ClassCsatForm
        campaign={campaign({
          scheduled_class_id: 'class-1',
          class_name: 'Pole Kids',
          attendee_user_id: 'minor-1',
          attendee_name: 'Sofía',
        })}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: /Califica la clase de Sofía: Pole Kids/ })).toBeInTheDocument();
    await rateAndSubmit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        scheduled_class_id: 'class-1',
        attendee_user_id: 'minor-1',
        class_rating: 4,
        instructor_rating: 4,
      }),
    );
  });

  it('rates the user own class without an attendee', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ClassCsatForm
        campaign={campaign({ scheduled_class_id: 'class-2', class_name: 'Flow', attendee_user_id: null })}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: /^Califica Flow/ })).toBeInTheDocument();
    await rateAndSubmit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        scheduled_class_id: 'class-2',
        class_rating: 4,
        instructor_rating: 4,
      }),
    );
  });
});
