import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge, Input, Label } from '@components/ui';
import { DansshipAPI, type EventAdmin, type EventInvite, type EventVisibility } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

/**
 * Who opens a legacy event (recital, the combo's workshops). Público / Privado and invites as before;
 * a `link_only` event shows its link read-only as inherited ("Con enlace (heredado)"): it can be copied
 * and the event switched to Público or Privado, but no event is put back on a link.
 */
export function LegacyEventAccessPanel({ event }: { event: EventAdmin }) {
  const { t } = useTranslation();
  const { response: invitesResponse, reFetch: reFetchInvites } = usePromise(
    () => DansshipAPI.eventosAdmin.listInvites(event.id),
    true,
    [event.id],
  );
  const [visibility, setVisibility] = useState<EventVisibility>(event.visibility ?? 'public');
  const [inviteQuery, setInviteQuery] = useState('');
  const [matches, setMatches] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const invites = invitesResponse?.data ?? [];
  const token = event.access_token ?? '';
  const inheritedLink =
    visibility === 'link_only' && token ? `${window.location.origin}${PageURLS.eventoAccess(token)}` : null;

  const saveVisibility = async (next: EventVisibility) => {
    const { data, ok } = await DansshipAPI.eventosAdmin.setVisibility(event.id, next);

    if (!ok || !data) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setVisibility(data.visibility ?? next);
  };

  const copyLink = async () => {
    if (!inheritedLink) return;

    try {
      await navigator.clipboard.writeText(inheritedLink);
      toast.success(t('eventos:admin.linkCopied'));
    } catch {
      toast.error(t('eventos:admin.linkCopyFailed'));
    }
  };

  const searchInvites = async () => {
    const { data } = await DansshipAPI.usersAdmin.search({ search: inviteQuery.trim(), limit: 8 });

    setMatches(data?.items ?? []);
  };

  const inviteUser = async (userId: string) => {
    const { ok } = await DansshipAPI.eventosAdmin.invite(event.id, userId);

    if (!ok) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setMatches([]);
    setInviteQuery('');
    await reFetchInvites();
  };

  return (
    <section className='grid gap-4 rounded-2xl border p-4'>
      <Label className='grid gap-1'>
        {t('eventos:admin.visibility')}
        <select
          className='h-10 rounded-md border px-3'
          value={visibility}
          onChange={change => void saveVisibility(change.target.value as EventVisibility)}
        >
          <option value='public'>{t('eventos:admin.visibilityPublic')}</option>
          <option value='invite_only'>{t('eventos:admin.visibilityInvite')}</option>
          {visibility === 'link_only' ? (
            <option value='link_only' disabled>
              {t('eventos:admin.visibilityInherited')}
            </option>
          ) : null}
        </select>
      </Label>
      {inheritedLink ? (
        <div className='grid gap-2'>
          <Badge variant='outlineNeutral' className='w-fit'>
            {t('eventos:admin.visibilityInherited')}
          </Badge>
          <div className='flex flex-wrap items-center gap-2'>
            <Input readOnly value={inheritedLink} aria-label={t('eventos:admin.inheritedLink')} />
            <Button color='primary' variant='outlined' type='button' onClick={() => void copyLink()}>
              {t('eventos:admin.copyLink')}
            </Button>
          </div>
        </div>
      ) : null}
      <div className='grid gap-2'>
        <Label className='grid gap-1'>
          {t('eventos:admin.inviteSearch')}
          <Input value={inviteQuery} onChange={change => setInviteQuery(change.target.value)} />
        </Label>
        <Button color='primary' variant='outlined' type='button' onClick={() => void searchInvites()}>
          {t('eventos:admin.searchPeople')}
        </Button>
        {matches.map(person => (
          <button
            key={person.id}
            type='button'
            className='text-left text-sm'
            onClick={() => void inviteUser(person.id)}
          >
            {person.full_name} · {person.email}
          </button>
        ))}
        <ul className='grid gap-1 text-sm'>
          {invites.map((invite: EventInvite) => (
            <li key={invite.id} className='flex items-center justify-between gap-2'>
              <span>
                {invite.display_name} · {invite.email}
              </span>
              <Button
                color='primary'
                variant='outlined'
                type='button'
                onClick={() =>
                  void DansshipAPI.eventosAdmin.uninvite(event.id, invite.user_id).then(() => reFetchInvites())
                }
              >
                {t('eventos:admin.removeInvite')}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
