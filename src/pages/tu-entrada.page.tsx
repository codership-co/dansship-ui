import { useCallback } from 'react';
import { useParams } from 'react-router';

import { EntryQrScreen } from '@components/modules/event-entry';
import { Isotype } from '@components/svg';
import { DansshipAPI } from '@core/api';

/** Public "Tu entrada" from the email link: no account, no navbar (like the halloween kiosk). */
export function TuEntradaPage() {
  const { token = '' } = useParams();
  const load = useCallback(() => DansshipAPI.entry.getPublicCode(token), [token]);

  return (
    <main className='grid min-h-dvh content-start gap-4 bg-background px-4 py-6'>
      <Isotype className='mx-auto h-8 text-primary' aria-hidden />
      <EntryQrScreen load={load} cacheKey={token} />
    </main>
  );
}
