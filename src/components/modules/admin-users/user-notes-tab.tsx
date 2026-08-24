import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Label, Textarea } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

export function UserNotesTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.userContextAdmin.getNotes(userId), !!userId);
  const { call: createNote, isLoading: isCreatingNote } = useCallablePromise((body: string) =>
    DansshipAPI.userContextAdmin.createNote(userId, { body }),
  );

  const notes = response?.data?.notes ?? [];
  const [noteBody, setNoteBody] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const canSubmitNote = Boolean(noteBody.trim());

  const handleConfirm = async () => {
    const { ok } = await createNote(noteBody.trim());

    if (!ok) {
      toast.error(t('admin:users.details.notesAndChannels.noteFailed'));

      return;
    }

    toast.success(t('admin:users.details.notesAndChannels.noteSuccess'));
    setNoteBody('');
    setIsConfirmOpen(false);
    void reFetch();
  };

  if (isLoading && !response) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  return (
    <section className='grid gap-4'>
      <form
        className='grid gap-4 rounded-md border bg-white/50 p-4'
        onSubmit={event => {
          event.preventDefault();

          if (canSubmitNote) setIsConfirmOpen(true);
        }}
      >
        <div className='grid gap-1.5'>
          <Label htmlFor='user-note-body'>{t('admin:users.details.notesAndChannels.noteLabel')}</Label>
          <Textarea
            id='user-note-body'
            value={noteBody}
            onChange={event => setNoteBody(event.target.value)}
            placeholder={t('admin:users.details.notesAndChannels.notePlaceholder')}
            required
          />
        </div>
        <div className='flex justify-end'>
          <Button type='submit' disabled={!canSubmitNote || isCreatingNote}>
            {t('admin:users.details.notesAndChannels.addNote')}
          </Button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className='py-4 text-center text-sm text-muted-foreground'>
          {t('admin:users.details.notesAndChannels.notesEmpty')}
        </p>
      ) : (
        <ul className='grid gap-3'>
          {notes.map(note => (
            <li key={note.id} className='rounded-md border bg-white/50 p-4'>
              <p className='whitespace-pre-wrap text-sm text-foreground'>{note.body}</p>
              <p className='mt-2 text-xs text-muted-foreground'>
                {note.created_by_full_name ??
                  note.created_by_email ??
                  t('admin:users.details.notesAndChannels.unknownAuthor')}
                {' · '}
                {format(parseISO(note.created_at), 'd MMM yyyy HH:mm', { locale })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={open => {
          if (!open && !isCreatingNote) setIsConfirmOpen(false);
        }}
        onConfirm={() => void handleConfirm()}
        title={t('admin:users.details.notesAndChannels.confirmNoteTitle')}
        description={t('admin:users.details.notesAndChannels.confirmNoteDescription')}
        confirmLabel={t('admin:users.details.notesAndChannels.addNote')}
        cancelLabel={t('common:cancel')}
        isLoading={isCreatingNote}
      />
    </section>
  );
}
