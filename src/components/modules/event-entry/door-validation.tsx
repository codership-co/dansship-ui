import { format } from 'date-fns';
import { useOnlineStatus } from 'polpo/hooks';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuWifiOff } from 'react-icons/lu';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { DoorCounters } from './door-counters';
import { DoorScanResult } from './door-scan-result';
import { DoorScanner } from './door-scanner';
import { DoorSearch } from './door-search';

import { SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import {
  DansshipAPI,
  participationErrorMessage,
  type DoorSearchRow,
  type EntryMinor,
  type EntryScanResult,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

type DoorTab = 'scan' | 'search';

const SAME_CODE_COOLDOWN_MS = 4_000;

/** The validation screen: counters, Escanear / Buscar, results; nothing is recorded offline. */
export function DoorValidation({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [tab, setTab] = useState<DoorTab>('scan');
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [result, setResult] = useState<EntryScanResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const lastCode = useRef<{ code: string; at: number } | null>(null);
  const scanning = useRef(false);

  const { response: events, isLoading: loadingEvents } = usePromise(() => DansshipAPI.entry.listDoorEvents(), true, []);
  const { response: counters, reFetch: refreshCounters } = usePromise(
    () => DansshipAPI.entry.getCounters(eventId),
    true,
    [eventId],
  );
  const {
    response: search,
    isLoading: searching,
    reFetch: refreshSearch,
  } = usePromise(() => DansshipAPI.entry.search(eventId, query), query.length >= 2, [eventId, query]);
  const event = events?.data?.find(item => item.id === eventId) ?? null;

  const refresh = useCallback(async () => {
    await Promise.all([refreshCounters(), query.length >= 2 ? refreshSearch() : Promise.resolve()]);
  }, [query, refreshCounters, refreshSearch]);

  const onCode = useCallback(
    async (code: string) => {
      const now = Date.now();
      const last = lastCode.current;

      if (!isOnline || scanning.current || result) return;

      if (last && last.code === code && now - last.at < SAME_CODE_COOLDOWN_MS) return;

      lastCode.current = { code, at: now };
      scanning.current = true;
      try {
        const { ok, data, error } = await DansshipAPI.entry.scan(eventId, code);

        if (ok && data) {
          setResult(data);
          navigator.vibrate?.(data.status === 'valid' ? 80 : [60, 60, 60]);
          void refreshCounters();
        } else {
          toast.error(participationErrorMessage(error, t, 'eventos:door.actionFailed'));
        }
      } finally {
        scanning.current = false;
      }
    },
    [eventId, isOnline, refreshCounters, result, t],
  );

  const enter = async (personId: string) => {
    setBusyId(personId);
    try {
      const { ok, data, error } = await DansshipAPI.entry.enter(eventId, personId);

      if (ok && data) {
        if (result) setResult(data);

        toast.success(t(data.status === 'valid' ? 'eventos:door.entryMarked' : 'eventos:door.result.already_used'));
        await refresh();
      } else {
        toast.error(participationErrorMessage(error, t, 'eventos:door.actionFailed'));
      }
    } finally {
      setBusyId(null);
    }
  };

  const donation = async (row: DoorSearchRow) => {
    if (!row.donation) return;

    setBusyId(row.donation.signup_id);
    try {
      const { ok, error } = await DansshipAPI.entry.setDonationReceived(row.donation.signup_id, true);

      if (ok) {
        toast.success(t('eventos:door.donationReceived'));
        await refresh();
      } else {
        toast.error(participationErrorMessage(error, t, 'eventos:door.actionFailed'));
      }
    } finally {
      setBusyId(null);
    }
  };

  const enterMinor = (minor: EntryMinor) => void enter(minor.person_id);

  const cameraOff = () => {
    setCameraUnavailable(true);
    setTab('search');
  };

  if (loadingEvents && !events) {
    return <SpinnerLoader />;
  }

  return (
    <div className='mx-auto grid w-full max-w-md gap-4'>
      <div className='grid gap-1'>
        <Link className='text-sm font-semibold text-primary' to={PageURLS.admin.entryDoor} viewTransition>
          {t('eventos:door.backToEvents')}
        </Link>
        <SectionHeading className='mb-0' title={event?.name ?? t('eventos:door.title')} />
        {event ? (
          <p className='m-0 text-sm text-muted-foreground'>
            {event.is_open
              ? t('eventos:door.openUntil', { time: format(new Date(event.entry_closes_at), 'HH:mm') })
              : t('eventos:door.opensAt', { time: format(new Date(event.entry_opens_at), 'HH:mm') })}
          </p>
        ) : null}
      </div>

      <DoorCounters counters={counters?.data ?? null} />

      {!isOnline ? (
        <p
          className='m-0 flex items-center gap-2 rounded-xl border border-warning-300 bg-warning-50 p-3 text-sm'
          role='alert'
        >
          <LuWifiOff aria-hidden className='size-4 shrink-0' />
          {t('eventos:door.offline')}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={value => setTab(value as DoorTab)} className='gap-4'>
        <TabsList className='w-full'>
          <TabsTrigger value='scan' className='flex-1'>
            {t('eventos:door.tabs.scan')}
          </TabsTrigger>
          <TabsTrigger value='search' className='flex-1'>
            {t('eventos:door.tabs.search')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value='scan' className='grid gap-3'>
          {result ? (
            <DoorScanResult
              result={result}
              disabled={!isOnline}
              busyId={busyId}
              onEnterMinor={enterMinor}
              onNext={() => setResult(null)}
            />
          ) : null}
          {cameraUnavailable ? (
            <p className='m-0 rounded-xl border border-border bg-white p-4 text-sm'>{t('eventos:door.cameraDenied')}</p>
          ) : tab === 'scan' ? (
            /*
             * Stays mounted under the result so the camera is not restarted per guest;
             * codes are ignored while a result is on screen.
             */
            <div className={result ? 'hidden' : undefined}>
              <DoorScanner onCode={code => void onCode(code)} onUnavailable={cameraOff} />
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value='search'>
          <DoorSearch
            rows={query.length >= 2 ? (search?.data?.items ?? []) : []}
            isLoading={searching}
            disabled={!isOnline}
            busyId={busyId}
            onQuery={setQuery}
            onEnter={row => void enter(row.person_id)}
            onEnterMinor={enterMinor}
            onDonation={row => void donation(row)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
