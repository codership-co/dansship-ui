import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { unzipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminFileAnswer } from './admin-file-answer';
import { answerFileFields, DownloadAnswerFiles } from './download-answer-files';

import { DansshipAPI, type ParticipantTypeAdmin } from '@core/api';
import '@core/i18n';

const song = { file_key: 'event-answer-files/u/a.mp3', file_name: 'cancion.mp3', content_type: 'audio/mpeg' };

const artists = {
  id: 'type-1',
  fields: [
    { key: 'act_name', label: 'Nombre de la presentación', kind: 'short_text', required: true, options: {} },
    { key: 'music', label: 'Tu canción', kind: 'file', required: true, options: { accepts: ['audio'] } },
  ],
} as unknown as ParticipantTypeAdmin;

describe('admin file answers', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('plays an uploaded song from a short-lived link', async () => {
    const view = vi.spyOn(DansshipAPI.participationAdmin, 'getAnswerFile').mockResolvedValue({
      ok: true,
      data: {
        view_url: 'https://view.example/a.mp3',
        expires_in: 3600,
        file_name: 'cancion.mp3',
        content_type: 'audio/mpeg',
      },
    } as never);

    const { container } = render(<AdminFileAnswer signupId='s-1' fieldKey='music' value={song} />);

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }));

    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', 'https://view.example/a.mp3'));
    expect(view).toHaveBeenCalledWith('s-1', 'music', false);
  });

  it('shows nothing for a link answer', () => {
    const { container } = render(
      <AdminFileAnswer signupId='s-1' fieldKey='music' value={{ url: 'https://youtu.be/x' }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('finds the file questions and the short answers to name the files by', () => {
    expect(answerFileFields([artists])).toEqual({
      files: [{ key: 'music', label: 'Tu canción' }],
      names: [{ key: 'act_name', label: 'Nombre de la presentación' }],
    });
  });

  describe('Descargar archivos', () => {
    let saved: Blob | null = null;

    beforeEach(() => {
      saved = null;
      vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue({ ok: true, data: [artists] } as never);
      URL.createObjectURL = vi.fn((blob: Blob) => {
        saved = blob;

        return 'blob:zip';
      }) as never;
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
    });

    it('zips every song with its numbered name', async () => {
      const list = vi.spyOn(DansshipAPI.participationAdmin, 'listAnswerFiles').mockResolvedValue({
        ok: true,
        data: {
          field_key: 'music',
          field_label: 'Tu canción',
          expires_in: 3600,
          items: [
            {
              signup_id: 's-1',
              person_name: 'Valentina',
              file_name: 'cancion.mp3',
              content_type: 'audio/mpeg',
              download_name: '01 - Raíces.mp3',
              view_url: 'https://view.example/a.mp3',
            },
          ],
        },
      } as never);

      render(<DownloadAnswerFiles eventId='e-1' eventSlug='clausura' />);
      fireEvent.click(await screen.findByRole('button', { name: 'Descargar todos' }));
      fireEvent.click(screen.getByRole('button', { name: 'Descargar .zip' }));

      await waitFor(() => expect(saved).not.toBeNull());
      // Named by presentation by default (the first short answer).
      expect(list).toHaveBeenCalledWith('e-1', 'music', 'act_name');
      const files = unzipSync(new Uint8Array(await (saved as unknown as Blob).arrayBuffer()));

      expect(Object.keys(files)).toEqual(['01 - Raíces.mp3']);
    });

    it('is hidden when no type asks for a file', async () => {
      vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue({
        ok: true,
        data: [{ ...artists, fields: [artists.fields[0]] }],
      } as never);

      render(<DownloadAnswerFiles eventId='e-1' eventSlug='clausura' />);

      await waitFor(() => expect(DansshipAPI.participationAdmin.listTypes).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Descargar todos' })).toBeNull();
    });
  });
});
