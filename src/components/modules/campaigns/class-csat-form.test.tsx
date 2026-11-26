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

async function rateAndSubmit(starLabel = '¡Me encantó!') {
  const [classStars, instructorStars] = screen.getAllByRole('radio', { name: starLabel });

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
          instructor_name: 'Laura',
        })}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: /Califica la clase de Sofía: Pole Kids/ })).toBeInTheDocument();
    expect(screen.getByText('¿Cómo le fue a Sofía en la clase?')).toBeInTheDocument();
    expect(screen.getByText('¿Cómo le fue a Sofía con Laura?')).toBeInTheDocument();
    expect(screen.getByText('Cuéntanos cómo le fue a Sofía (opcional)')).toBeInTheDocument();
    await rateAndSubmit('¡Le encantó!');

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
    expect(screen.getByText('¿Qué te pareció la clase?')).toBeInTheDocument();
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
