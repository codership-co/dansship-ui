import { AsideModal } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { FaCartArrowDown, FaChalkboardTeacher } from 'react-icons/fa';
import { GiAvoidance } from 'react-icons/gi';
import { GrSchedules } from 'react-icons/gr';
import { HiOutlineDocument } from 'react-icons/hi';
import { HiMiniShoppingCart } from 'react-icons/hi2';
import { LuBellElectric, LuBookHeart, LuBookImage, LuCalendarHeart, LuFootprints, LuUser, LuX } from 'react-icons/lu';
import { MdOutlineInventory, MdOutlinePayments } from 'react-icons/md';
import { RiAdminFill, RiFolderKeyholeLine } from 'react-icons/ri';
import { SiReasonstudios } from 'react-icons/si';
import { TbManualGearbox } from 'react-icons/tb';
import { TfiAgenda } from 'react-icons/tfi';
import { useNavigate } from 'react-router';

import { MenuItem, NavItem } from './navbar';

import { Isotype, Logotype } from '@components/svg';
import { Button } from '@components/ui';
import { FEATURE_FLAG, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, InstructorPermissions, PERMISSION } from '@core/permissions';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const authenticatedPrimaryMenuItems: Array<NavItem> = [
    {
      to: PageURLS.profile,
      label: t('nav:profile'),
      featureFlags: [FEATURE_FLAG.isProfilePageEnabled],
      icon: LuUser,
    },
    {
      to: PageURLS.classes,
      label: t('nav:menuScheduleClass'),
      featureFlags: [FEATURE_FLAG.isClassesPageEnabled],
      icon: LuFootprints,
    },
    {
      to: PageURLS.myAccountSubscription,
      label: t('nav:menuPlans'),
      featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
      icon: LuBellElectric,
    },
    {
      to: PageURLS.myAccountBookings,
      label: t('nav:menuBookings'),
      featureFlags: [FEATURE_FLAG.isMyAccountBookingsPageEnabled],
      icon: LuCalendarHeart,
    },
    {
      to: PageURLS.figures,
      label: t('nav:menuFigures'),
      featureFlags: [FEATURE_FLAG.isFiguresPageEnabled],
      icon: LuBookImage,
    },
    {
      to: PageURLS.figureSaved,
      label: t('nav:menuProgress'),
      featureFlags: [FEATURE_FLAG.isFigureSavedPageEnabled],
      icon: LuBookHeart,
    },
  ];

  const adminMenuItems: Array<NavItem> = [
    {
      to: '/admin',
      label: t('nav:admin'),
      orPermissions: [
        ...AdminPermissions.scheduleBuilder,
        ...AdminPermissions.inventory,
        ...AdminPermissions.bookings,
        ...AdminPermissions.payments,
        ...AdminPermissions.merch,
        ...AdminPermissions.merchPos,
        ...AdminPermissions.figures,
        ...AdminPermissions.reports,
        ...AdminPermissions.access,
        ...AdminPermissions.studioRental,
      ],
      icon: RiAdminFill,
      featureFlags: [FEATURE_FLAG.isAdminPageEnabled],
    },
    {
      to: PageURLS.admin.agenda,
      label: t('nav:adminMenu.agenda'),
      orPermissions: AdminPermissions.scheduleBuilder,
      featureFlags: [FEATURE_FLAG.isAdminAgendaPageEnabled],
      icon: TfiAgenda,
    },
    {
      to: PageURLS.admin.scheduleBuilder,
      label: t('nav:adminMenu.scheduleBuilder'),
      orPermissions: AdminPermissions.scheduleBuilder,
      featureFlags: [FEATURE_FLAG.isAdminScheduleBuilderPageEnabled],
      icon: GrSchedules,
    },
    {
      to: PageURLS.admin.studioRental,
      label: t('nav:adminMenu.studioRental'),
      orPermissions: AdminPermissions.studioRental,
      featureFlags: [FEATURE_FLAG.isAdminStudioRentalPageEnabled],
      icon: SiReasonstudios,
    },
    {
      to: PageURLS.admin.reports,
      label: t('nav:adminMenu.reportsConfig'),
      orPermissions: AdminPermissions.reports,
      featureFlags: [FEATURE_FLAG.isAdminReportsPageEnabled],
      icon: HiOutlineDocument,
    },
    {
      to: PageURLS.admin.access,
      label: t('nav:adminMenu.accessManagement'),
      orPermissions: AdminPermissions.access,
      featureFlags: [FEATURE_FLAG.isAdminAccessPageEnabled],
      icon: RiFolderKeyholeLine,
    },
    {
      to: PageURLS.admin.inventory,
      label: t('nav:adminMenu.inventoryBilling'),
      orPermissions: AdminPermissions.inventory,
      featureFlags: [FEATURE_FLAG.isAdminInventoryPageEnabled],
      icon: MdOutlineInventory,
    },
    {
      to: PageURLS.admin.bookings,
      label: t('nav:adminMenu.manualBookings'),
      orPermissions: AdminPermissions.bookings,
      featureFlags: [FEATURE_FLAG.isAdminBookingsPageEnabled],
      icon: TbManualGearbox,
    },
    {
      to: PageURLS.admin.payments,
      label: t('nav:adminMenu.payments'),
      orPermissions: AdminPermissions.payments,
      featureFlags: [FEATURE_FLAG.isAdminPaymentsPageEnabled],
      icon: MdOutlinePayments,
    },
    {
      to: PageURLS.admin.figures,
      label: t('nav:adminMenu.figures'),
      orPermissions: AdminPermissions.figures,
      featureFlags: [FEATURE_FLAG.isAdminFiguresPageEnabled],
      icon: GiAvoidance,
    },
    {
      to: PageURLS.admin.merch,
      label: t('nav:adminMenu.merchProducts'),
      orPermissions: AdminPermissions.merch,
      featureFlags: [FEATURE_FLAG.isAdminMerchPageEnabled],
      icon: HiMiniShoppingCart,
    },
    {
      to: PageURLS.admin.merchPos,
      label: t('nav:adminMenu.merchPos'),
      orPermissions: AdminPermissions.merchPos,
      featureFlags: [FEATURE_FLAG.isAdminMerchPosPageEnabled],
      icon: FaCartArrowDown,
    },
    {
      to: PageURLS.instructorDashboard,
      label: t('nav:instructorPortal'),
      orPermissions: [...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE],
      featureFlags: [FEATURE_FLAG.isInstructorDashboardPageEnabled],
      icon: FaChalkboardTeacher,
    },
  ];

  if (!isOpen) return null;

  return (
    <AsideModal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName='p-0 h-full overflow-auto flex flex-col'
      size='340px'
      noCloseButton
    >
      <div className='p-4 flex items-center justify-between border-b'>
        <div className='flex items-center gap-2'>
          <span className='size-8 rounded-full grid place-content-center bg-primary'>
            <Isotype className='w-2/3 mx-auto' mainColor='var(--color-accent)' />
          </span>
          <Logotype className='h-5 text-primary' />
        </div>
        <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
          <LuX className='w-6 h-6' />
        </button>
      </div>

      <div className='p-4 flex-1 flex flex-col min-h-0'>
        <nav className='grid gap-12 overflow-y-auto'>
          <section className='grid gap-4'>
            {authenticatedPrimaryMenuItems.map(item => (
              <MenuItem key={item.to} {...item} variant='aside' />
            ))}
          </section>

          {user?.isAdmin && (
            <section>
              <span className='font-bold uppercase text-primary mb-4 block'>{t('nav:admin')}</span>
              <section className='grid gap-4'>
                {adminMenuItems.map(item => (
                  <MenuItem key={item.to} {...item} variant='aside' />
                ))}
              </section>
            </section>
          )}
        </nav>

        {/*<div className='mt-auto space-y-3 pt-4'>
            <LanguageSelector variant='buttons' />
          </div>*/}
      </div>

      <div className='p-4 grid border-t'>
        <Button
          onClick={() => {
            logout();
            onClose();
            navigate(PageURLS.home, { replace: true });
          }}
          variant='ghost'
        >
          {t('nav:signOut')}
        </Button>
      </div>
    </AsideModal>
  );
}
