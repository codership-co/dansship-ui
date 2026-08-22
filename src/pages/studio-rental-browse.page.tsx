import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { StudioRentalBookingWizard, StudioRentalRoomGrid } from '@components/modules/studio-rental';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, type StudioRentalRoomOption } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function StudioRentalBrowsePage() {
  const { t } = useTranslation();
  const [selectedRoom, setSelectedRoom] = useState<StudioRentalRoomOption | null>(null);
  const {
    response: rooms,
    isLoading: isLoadingRooms,
    error: roomsError,
  } = usePromise(() => DansshipAPI.studioRental.getRooms());

  return (
    <div className='mx-auto max-w-6xl space-y-6 px-4 py-8 pt-20'>
      <div>
        <h1 className='text-3xl font-bold text-primary'>{t('studioRental:browse.title')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('studioRental:browse.subtitle')}</p>
      </div>

      {isLoadingRooms ? (
        <SpinnerLoader message={t('studioRental:browse.roomsLoading')} />
      ) : roomsError || rooms?.ok === false ? (
        <p className='text-sm text-alert'>{t('studioRental:browse.roomsLoadError')}</p>
      ) : (rooms?.data ?? []).length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('studioRental:browse.noRooms')}</p>
      ) : (
        <StudioRentalRoomGrid rooms={rooms?.data ?? []} onSelect={setSelectedRoom} />
      )}

      {selectedRoom ? (
        <StudioRentalBookingWizard room={selectedRoom} isOpen onClose={() => setSelectedRoom(null)} />
      ) : null}
    </div>
  );
}

export const SecureStudioRentalBrowsePage = SecurityGuard(StudioRentalBrowsePage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalBrowsePageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
