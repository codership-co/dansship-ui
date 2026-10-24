import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { usePromise } from '@hooks';

interface UserFamilyTabProps {
  userId: string;
}

export function UserFamilyTab({ userId }: UserFamilyTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = Boolean(user?.permissions?.includes(PERMISSION.GUARDIANSHIP_MANAGE));
  const { response, reFetch } = usePromise(() => DansshipAPI.family.getAdminFamily(userId), Boolean(userId), [userId]);
  const family = response?.data;
  const minors = family?.minors ?? (family && 'minor' in family && family.minor ? [family.minor] : []);
  const pendingRequests = family?.pending_requests ?? [];
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentValue, setDocumentValue] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<{ ok: boolean }>) => {
    if (!reason.trim()) {
      return;
    }

    setBusy(true);
    const result = await action();
    setBusy(false);

    if (result.ok) {
      setReason('');
      await reFetch();
    }
  };

  if (!family) {
    return <p>{t('family:admin.noFamily')}</p>;
  }

  return (
    <section className='grid gap-6'>
      {family.guardian ? (
        <p>
          {t('family:admin.guardian')}: {family.guardian.full_name} ({family.guardian.relationship})
        </p>
      ) : null}

      <div>
        <h3>{t('family:admin.minors')}</h3>
        <ul className='grid gap-4'>
          {minors.map(minor => (
            <li key={minor.user_id} className='grid gap-2 rounded-xl border p-4'>
              <p>
                {minor.full_name}
                {minor.age !== null ? ` · ${minor.age}` : ''} · {minor.document_type} {minor.document_value_masked}
              </p>
              {canManage ? (
                <div className='flex flex-wrap gap-2'>
                  <input
                    className='rounded border px-2 py-1'
                    placeholder={t('family:fields.reason')}
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                  />
                  <input
                    className='rounded border px-2 py-1'
                    placeholder='email'
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                  />
                  <Button
                    type='button'
                    variant='outlined'
                    color='secondary'
                    isLoading={busy}
                    onClick={() => void run(() => DansshipAPI.family.requestTransfer(minor.user_id, email, reason))}
                  >
                    {t('family:admin.transfer')}
                  </Button>
                  <Button
                    type='button'
                    color='alert'
                    isLoading={busy}
                    onClick={() => void run(() => DansshipAPI.family.deactivateMinor(minor.user_id, reason))}
                  >
                    {t('family:admin.deactivate')}
                  </Button>
                </div>
              ) : null}
              {canManage ? (
                <div className='flex flex-wrap gap-2'>
                  <input
                    className='rounded border px-2 py-1'
                    placeholder={t('family:fields.documentType')}
                    value={documentType}
                    onChange={event => setDocumentType(event.target.value)}
                  />
                  <input
                    className='rounded border px-2 py-1'
                    placeholder={t('family:fields.documentValue')}
                    value={documentValue}
                    onChange={event => setDocumentValue(event.target.value)}
                  />
                  <input
                    className='rounded border px-2 py-1'
                    type='date'
                    value={birthDate}
                    onChange={event => setBirthDate(event.target.value)}
                  />
                  <Button
                    type='button'
                    variant='outlined'
                    color='secondary'
                    isLoading={busy}
                    onClick={() =>
                      void run(() =>
                        DansshipAPI.family.updateIdentity(minor.user_id, {
                          reason,
                          document_type: documentType || undefined,
                          document_value: documentValue || undefined,
                          birth_date: birthDate || undefined,
                        }),
                      )
                    }
                  >
                    {t('family:admin.identity')}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>{t('family:admin.reviews')}</h3>
        <ul className='grid gap-3'>
          {pendingRequests.map(request => (
            <li key={request.id} className='flex flex-wrap items-center gap-2'>
              <span>
                {request.given_name} {request.family_name}
              </span>
              {canManage ? (
                <>
                  <Button
                    type='button'
                    color='primary'
                    isLoading={busy}
                    onClick={() => void run(() => DansshipAPI.family.approveRequest(request.id, reason))}
                  >
                    {t('family:admin.approve')}
                  </Button>
                  <Button
                    type='button'
                    variant='outlined'
                    color='secondary'
                    isLoading={busy}
                    onClick={() => void run(() => DansshipAPI.family.rejectRequest(request.id, reason))}
                  >
                    {t('family:admin.reject')}
                  </Button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {minors.length === 0 && !family.guardian && pendingRequests.length === 0 ? (
        <p>{t('family:admin.noFamily')}</p>
      ) : null}
    </section>
  );
}
