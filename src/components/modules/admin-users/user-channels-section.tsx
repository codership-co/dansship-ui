import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Checkbox, Input, Label } from '@components/ui';
import { DansshipAPI, type CommunicationPlatform, type CreateUserChannelPayload } from '@core/api';
import { buildInstagramLink, buildWhatsAppLink } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

type PendingWrite = { kind: 'channel' } | { kind: 'favorite'; channelId: string; identifier: string };

export function UserChannelsSection({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.userContextAdmin.getChannels(userId), !!userId);
  const { call: createChannel, isLoading: isCreatingChannel } = useCallablePromise(
    (payload: CreateUserChannelPayload) => DansshipAPI.userContextAdmin.createChannel(userId, payload),
  );
  const { call: markFavorite, isLoading: isMarkingFavorite } = useCallablePromise((channelId: string) =>
    DansshipAPI.userContextAdmin.markChannelFavorite(userId, channelId),
  );

  const channels = response?.data?.channels ?? [];
  const isSubmitting = isCreatingChannel || isMarkingFavorite;
  const [platform, setPlatform] = useState<CommunicationPlatform>('whatsapp');
  const [identifier, setIdentifier] = useState('');
  const [markAsFavorite, setMarkAsFavorite] = useState(false);
  const [pendingWrite, setPendingWrite] = useState<PendingWrite | null>(null);
  const canSubmitChannel = Boolean(identifier.trim());

  const handleConfirm = async () => {
    if (!pendingWrite) return;

    if (pendingWrite.kind === 'channel') {
      const { ok } = await createChannel({
        platform,
        identifier: identifier.trim(),
        is_favorite: markAsFavorite,
      });

      if (!ok) {
        toast.error(t('admin:users.details.notesAndChannels.channelFailed'));

        return;
      }

      toast.success(t('admin:users.details.notesAndChannels.channelSuccess'));
      setIdentifier('');
      setMarkAsFavorite(false);
      setPendingWrite(null);
      void reFetch();

      return;
    }

    const { ok } = await markFavorite(pendingWrite.channelId);

    if (!ok) {
      toast.error(t('admin:users.details.notesAndChannels.favoriteFailed'));

      return;
    }

    toast.success(t('admin:users.details.notesAndChannels.favoriteSuccess'));
    setPendingWrite(null);
    void reFetch();
  };

  const confirmCopy =
    pendingWrite?.kind === 'channel'
      ? {
          title: t('admin:users.details.notesAndChannels.confirmChannelTitle'),
          description: t('admin:users.details.notesAndChannels.confirmChannelDescription', {
            platform: t(`admin:users.details.notesAndChannels.platforms.${platform}`),
            identifier: identifier.trim(),
          }),
          confirmLabel: t('admin:users.details.notesAndChannels.addChannel'),
        }
      : pendingWrite?.kind === 'favorite'
        ? {
            title: t('admin:users.details.notesAndChannels.confirmFavoriteTitle'),
            description: t('admin:users.details.notesAndChannels.confirmFavoriteDescription', {
              identifier: pendingWrite.identifier,
            }),
            confirmLabel: t('admin:users.details.notesAndChannels.markFavorite'),
          }
        : { title: '', description: '', confirmLabel: '' };

  if (isLoading && !response) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  return (
    <section className='grid gap-4'>
      <h3 className='text-sm font-semibold'>{t('admin:users.details.notesAndChannels.channelsTitle')}</h3>
      <form
        className='grid gap-4 rounded-md border bg-white/50 p-4'
        onSubmit={event => {
          event.preventDefault();

          if (canSubmitChannel) setPendingWrite({ kind: 'channel' });
        }}
      >
        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='grid gap-1.5'>
            <Label htmlFor='user-channel-platform'>{t('admin:users.details.notesAndChannels.platform')}</Label>
            <select
              id='user-channel-platform'
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={platform}
              onChange={event => setPlatform(event.target.value as CommunicationPlatform)}
            >
              <option value='whatsapp'>{t('admin:users.details.notesAndChannels.platforms.whatsapp')}</option>
              <option value='instagram'>{t('admin:users.details.notesAndChannels.platforms.instagram')}</option>
            </select>
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='user-channel-identifier'>{t('admin:users.details.notesAndChannels.identifier')}</Label>
            <Input
              id='user-channel-identifier'
              value={identifier}
              onChange={event => setIdentifier(event.target.value)}
              placeholder={t('admin:users.details.notesAndChannels.identifierPlaceholder')}
              required
            />
          </div>
        </div>
        <label className='flex items-center gap-2 text-sm'>
          <Checkbox checked={markAsFavorite} onCheckedChange={checked => setMarkAsFavorite(checked === true)} />
          {t('admin:users.details.notesAndChannels.markFavorite')}
        </label>
        <div className='flex justify-end'>
          <Button type='submit' disabled={!canSubmitChannel || isSubmitting}>
            {t('admin:users.details.notesAndChannels.addChannel')}
          </Button>
        </div>
      </form>
      {channels.length === 0 ? (
        <p className='py-4 text-center text-sm text-muted-foreground'>
          {t('admin:users.details.notesAndChannels.channelsEmpty')}
        </p>
      ) : (
        <ul className='grid gap-3'>
          {channels.map(channel => {
            const href =
              channel.platform === 'instagram'
                ? buildInstagramLink(channel.identifier)
                : buildWhatsAppLink(channel.identifier);

            return (
              <li
                key={channel.id}
                className='flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white/50 p-4'
              >
                <div className='grid gap-1'>
                  <p className='text-sm font-medium'>
                    {t(`admin:users.details.notesAndChannels.platforms.${channel.platform}`)}
                    {channel.is_favorite ? (
                      <span className='ml-2 text-xs font-normal text-primary'>
                        {t('admin:users.details.notesAndChannels.favoriteBadge')}
                      </span>
                    ) : null}
                  </p>
                  <a
                    href={href}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm text-primary underline underline-offset-2'
                  >
                    {channel.identifier}
                  </a>
                </div>
                {channel.is_favorite ? null : (
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isSubmitting}
                    onClick={() =>
                      setPendingWrite({
                        kind: 'favorite',
                        channelId: channel.id,
                        identifier: channel.identifier,
                      })
                    }
                  >
                    {t('admin:users.details.notesAndChannels.markFavorite')}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingWrite !== null}
        onOpenChange={open => {
          if (!open && !isSubmitting) setPendingWrite(null);
        }}
        onConfirm={() => void handleConfirm()}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        cancelLabel={t('common:cancel')}
        isLoading={isSubmitting}
      />
    </section>
  );
}
