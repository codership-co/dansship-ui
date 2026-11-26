import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MyFileAnswer } from './my-file-answer';

import { DansshipAPI, type SignupAnswerView } from '@core/api';
import '@core/i18n';

const answer: SignupAnswerView = {
  key: 'music',
  label: 'Tu canción',
  kind: 'file',
  value: { file_key: 'event-answer-files/u/a.mp3', file_name: 'cancion.mp3', content_type: 'audio/mpeg' },
  replaceable: true,
  replace_closes_at: '2026-12-12T04:59:59Z',
};

describe('MyFileAnswer', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('replaces the song with a video link after the signup closed', async () => {
    vi.spyOn(DansshipAPI.participation, 'getForm').mockResolvedValue({
      ok: true,
      data: {
        fields: [
          {
            key: 'music',
            label: 'Tu canción',
            kind: 'file',
            required: true,
            options: { accepts: ['audio'], allow_link: true },
          },
        ],
      },
    } as never);
    const replace = vi.spyOn(DansshipAPI.participation, 'replaceAnswer').mockResolvedValue({
      ok: true,
      data: { ...answer, value: { url: 'https://youtu.be/x', note: '' } },
    } as never);

    render(<MyFileAnswer signupId='s-1' participantTypeId='type-1' answer={answer} />);

    expect(screen.getByText('cancion.mp3')).toBeVisible();
    expect(screen.getByText(/Puedes cambiarlo hasta el/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar archivo' }));
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Pegar enlace' }));
    fireEvent.change(screen.getByPlaceholderText('https://'), { target: { value: 'https://youtu.be/x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('s-1', 'music', { url: 'https://youtu.be/x', note: '' }));
    expect(await screen.findByText('https://youtu.be/x')).toBeVisible();
  });

  it('offers no change once the window closed', () => {
    render(<MyFileAnswer signupId='s-1' participantTypeId='type-1' answer={{ ...answer, replaceable: false }} />);

    expect(screen.queryByRole('button', { name: 'Cambiar archivo' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeVisible();
  });
});
