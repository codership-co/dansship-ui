import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnswerFileUploaderProvider, FileOrLinkControl, type AnswerFileUploader } from './file-answer-input';
import { FormItemDialog } from './form-item-dialog';
import {
  acceptedFileTypes,
  emptyAnswer,
  isAnswerEmpty,
  isFileAnswer,
  type FileFormAnswer,
  type FormItem,
} from './form-items';

import '@core/i18n';

const music: FormItem = {
  key: 'music',
  label: 'Tu canción',
  kind: 'file',
  required: true,
  options: { accepts: ['audio'], allow_link: true, with_note: true },
  replace_closes_at: '2026-12-12T04:59:59Z',
};

const uploaded: FileFormAnswer = {
  file_key: 'event-answer-files/u/a.mp3',
  file_name: 'cancion.mp3',
  content_type: 'audio/mpeg',
};

function Harness({ uploader, item = music }: { uploader: AnswerFileUploader | null; item?: FormItem }) {
  const [value, setValue] = useState<unknown>(emptyAnswer(item));

  return (
    <AnswerFileUploaderProvider value={uploader}>
      <FileOrLinkControl item={item} value={value as never} onChange={setValue} />
      <output data-testid='value'>{JSON.stringify(value)}</output>
    </AnswerFileUploaderProvider>
  );
}

function pickFile(file: File) {
  const input = document.querySelector('input[type=file]') as HTMLInputElement;

  fireEvent.change(input, { target: { files: [file] } });
}

describe('file answers', () => {
  afterEach(cleanup);

  it('knows a file answer, its accepted types and when it is empty', () => {
    expect(isFileAnswer(uploaded)).toBe(true);
    expect(isFileAnswer({ url: 'https://x.com' })).toBe(false);
    expect(isAnswerEmpty(music, uploaded)).toBe(false);
    expect(isAnswerEmpty(music, { url: ' ', note: '' })).toBe(true);
    expect(acceptedFileTypes(music)).toContain('audio/mpeg');
    expect(acceptedFileTypes(music)).not.toContain('application/pdf');
  });

  it('uploads the picked audio and keeps it as the answer, with the replace date', async () => {
    const upload = vi.fn().mockResolvedValue(uploaded);

    render(<Harness uploader={{ upload }} />);
    pickFile(new File(['x'], 'cancion.mp3', { type: 'audio/mpeg' }));

    await waitFor(() => expect(upload).toHaveBeenCalledWith(music, expect.any(File)));
    await waitFor(() => expect(screen.getByTestId('value').textContent).toContain('event-answer-files/u/a.mp3'));
    expect(screen.getByText('cancion.mp3')).toBeVisible();
    expect(screen.getByText(/Puedes cambiarlo hasta el/)).toBeVisible();
  });

  it('takes a video link from the link tab', () => {
    render(<Harness uploader={{ upload: vi.fn() }} />);

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pegar enlace' }));
    fireEvent.change(screen.getByPlaceholderText('https://'), { target: { value: 'https://youtu.be/x' } });

    expect(JSON.parse(screen.getByTestId('value').textContent ?? '')).toEqual({ url: 'https://youtu.be/x', note: '' });
  });

  it('turns the picker off without an uploader (admin preview)', () => {
    render(<Harness uploader={null} item={{ ...music, options: { accepts: ['audio'] } }} />);

    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.getByText('En la vista previa no se suben archivos.')).toBeVisible();
  });

  it('the builder saves accepted types, the link option and the replace window', () => {
    const onSave = vi.fn();

    render(
      <FormItemDialog
        open
        mode='question'
        item={null}
        otherItems={[]}
        kinds={['file']}
        onOpenChange={() => undefined}
        onSave={onSave}
      />,
    );
    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('Pregunta'), { target: { value: 'Tu canción' } });
    fireEvent.click(within(dialog).getByRole('switch', { name: /PDF/ }));
    fireEvent.click(within(dialog).getByRole('switch', { name: /Permitir un enlace/ }));
    fireEvent.change(within(dialog).getByLabelText('Se puede cambiar hasta'), { target: { value: '1' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'file',
        options: expect.objectContaining({
          accepts: ['audio', 'pdf'],
          allow_link: true,
          replaceable_until: { anchor: 'days_before_event', days: 1 },
        }),
      }),
    );
  });
});
