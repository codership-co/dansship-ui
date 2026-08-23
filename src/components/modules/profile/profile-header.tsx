import { Badge, Button } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileUpload, FaSave } from 'react-icons/fa';
import { LuCalendar, LuClipboardList, LuCreditCard, LuFileText, LuGift, LuPencil, LuWallet } from 'react-icons/lu';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { Section } from '@components/containers';
import { ProfilePicture } from '@components/ui';
import { FEATURE_FLAG, useAuth, useEnabledFeatureFlag, useOrPermissions } from '@contexts';
import { DansshipAPI, PaymentProofContentType, PaymentProofContentTypesList } from '@core/api';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';
import { usePromise } from '@hooks';

interface ProfileHeaderProps {
  onEdit: () => void;
  editMode: boolean;
}

export function ProfileHeader({ editMode, onEdit }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { user, uploadProfilePhoto } = useAuth();
  const [imageURL, setImageURL] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const canManageOwnPaymentDocuments = useOrPermissions([PERMISSION.OWN_PAYMENT_DOCUMENT_MANAGE]);
  const isStudioRentalRequestsEnabled = useEnabledFeatureFlag([
    FEATURE_FLAG.areUserPagesEnabled,
    FEATURE_FLAG.isStudioRentalRequestsPageEnabled,
  ]);
  const { response: savedFiguresResponse } = usePromise(() => DansshipAPI.figures.getSavedFigures());
  const { response: mySubscriptionsResponse } = usePromise(() => DansshipAPI.subscriptions.getMySubscriptions());
  const savedFigures = savedFiguresResponse?.data ?? [];
  const summary = mySubscriptionsResponse?.data?.summary ?? null;

  if (!user) return null;

  const profileCompletion = user.profileCompletionPercent ?? 100;
  const bio = user.instructorProfile?.bio || user.bio;
  const displayImage = imageURL || user.avatar || user.instructorProfile?.photoUrl || undefined;

  const handleInputFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    const isValidType = Object.values(PaymentProofContentType).includes(file.type as PaymentProofContentType);

    if (!isValidType) {
      toast.error(t('payments:proofInvalidTypeTitle'));
      input.value = '';

      return;
    }

    setImageURL(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      await uploadProfilePhoto(file);
    } finally {
      setIsUploading(false);
      // Retain the input ref before await — React clears currentTarget after the event handler yields.
      input.value = '';
    }
  };

  return (
    <section data-sentry-mask>
      <Section navbarPadding className='bg-primary' contentClassName='pb-8 md:pb-15'>
        <section className='bg-white rounded-[0_100px_0_100px] md:rounded-[0_158px_0_158px] shadow-2xl grid md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] lg:gap-8 mt-20 items-center overflow-hidden'>
          <section className='relative bg-accent h-full p-4 xl:p-6 flex overflow-hidden' data-sentry-block>
            <ProfilePicture
              image={displayImage}
              className='transition-all size-50 xl:size-80 border-10 bg-transparent border-accent m-auto'
            />
            <section
              className={cn(
                !editMode && 'hidden',
                editMode && 'absolute top-0 left-0 size-full bg-gray-400/50 grid place-content-center',
                isUploading && 'pointer-events-none opacity-70',
              )}
            >
              <section className='rounded-full size-50 text-white bg-gray-300/50 shadow-sm grid place-content-center border border-solid'>
                <FaFileUpload className='size-20' />
              </section>
              <input
                type='file'
                className='absolute size-full top-0 left-0 cursor-pointer opacity-0'
                accept={PaymentProofContentTypesList.join(',')}
                onChange={handleInputFileUpload}
              />
            </section>
          </section>
          <section className='px-8 py-8 grid justify-items-center md:justify-items-start md:pl-8 md:pr-8 lg:pr-16'>
            {user.roles.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-2'>
                {user.roles.map(role => (
                  <Badge key={role}>{role}</Badge>
                ))}
              </div>
            )}

            <h2 className='text-primary'>{user.displayName || user.fullName || user.name || user.username}</h2>

            {bio && <p className='hidden sm:block'>{bio}</p>}

            <section className='grid grid-cols-[80px_80px] xs:grid-cols-[repeat(auto-fit,80px)] gap-3 text-center justify-center md:justify-start w-full'>
              <article className='w-20 grid justify-items-center'>
                <h4 className='m-0'>{savedFigures.length}</h4>
                <small className='m-0'>{t('profile:stats.savedFigures')}</small>
              </article>

              <article className='w-20 grid justify-items-center'>
                <h4 className='m-0'>{summary?.total_remaining_classes}</h4>
                <small className='m-0'>{t('subscriptions:totalRemaining')}</small>
              </article>

              <article className='w-20 grid justify-items-center'>
                <h4 className='m-0'>{summary?.active_count}</h4>
                <small className='m-0'>{t('subscriptions:activePlans')}</small>
              </article>

              <article className='lg:hidden w-20 grid justify-items-center'>
                <h4 className='m-0'>{profileCompletion}%</h4>
                <small className='m-0'>{t('profile:completion')}</small>
              </article>
            </section>
          </section>

          <section className='hidden lg:block relative size-50 xl:size-60 mr-14 rounded-full'>
            <span className='absolute top-2.5 left-2.5 size-full z-1 bg-primary/60 rounded-full animate-[spin_23s_linear_infinite] origin-[43%_49%]' />
            <span className='absolute -top-4 left-2.5 size-full z-1 scale-[5px] bg-accent/60 rounded-full animate-[spin_17s_linear_infinite_reverse] origin-[43%_55%]' />
            <span className='absolute top-2 -left-5 size-full z-1 scale-[-5px] bg-tertiary/60 rounded-full animate-[spin_14s_linear_infinite] origin-[55%_44%]' />
            <article className='relative size-full bg-secondary-200/80 rounded-full grid place-content-center text-center z-15 justify-items-center'>
              <h2 className='m-0 text-primary'>{profileCompletion}%</h2>
              <label className='m-0 w-20'>{t('profile:completion')}</label>
            </article>
          </section>
        </section>
      </Section>

      <Section>
        <section className='relative pt-8 md:pt-0'>
          <section className='bg-white md:bg-accent/80 w-full md:w-auto backdrop-blur-md p-4 shadow-lg rounded-lg flex flex-col md:flex-row gap-4 md:absolute md:top-full md:-translate-y-1/2 md:right-0'>
            <Button variant='solid' color='secondary' size='small' fullWidth onClick={onEdit}>
              {editMode ? <FaSave className='size-4' /> : <LuPencil className='size-4' />}
              {editMode ? t('common:save') : t('common:edit')}
            </Button>

            <Link to={PageURLS.profile.subscription}>
              <Button variant='solid' color='primary' size='small' fullWidth>
                <LuCreditCard className='h-4 w-4' />
                {t('profile:subscriptions')}
              </Button>
            </Link>

            <Link to={PageURLS.profile.bookings}>
              <Button variant='solid' color='primary' size='small' fullWidth>
                <LuCalendar className='h-4 w-4' />
                {t('profile:bookings')}
              </Button>
            </Link>

            {isStudioRentalRequestsEnabled ? (
              <Link to={PageURLS.studioRentalRequests}>
                <Button variant='solid' color='primary' size='small' fullWidth>
                  <LuClipboardList className='h-4 w-4' />
                  {t('profile:rentalRequests')}
                </Button>
              </Link>
            ) : null}

            <Link to={PageURLS.profile.wallet}>
              <Button variant='solid' color='primary' size='small' fullWidth>
                <LuWallet className='h-4 w-4' />
                {t('profile:wallet.nav')}
              </Button>
            </Link>

            {canManageOwnPaymentDocuments && user.cuentaDeCobroEnabled !== false ? (
              <Link to={PageURLS.profile.paymentDocuments}>
                <Button variant='solid' color='primary' size='small' fullWidth>
                  <LuFileText className='h-4 w-4' />
                  {t('profile:paymentDocuments.nav')}
                </Button>
              </Link>
            ) : null}

            <Link to={PageURLS.profile.gifts}>
              <Button variant='solid' color='primary' size='small' fullWidth>
                <LuGift className='h-4 w-4' />
                {t('profile:gifts.nav')}
              </Button>
            </Link>
          </section>
        </section>
      </Section>
    </section>
  );
}
