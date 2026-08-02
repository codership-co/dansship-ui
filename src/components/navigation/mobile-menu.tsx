import { AsideModal, Button, Line } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';
import { FaCartArrowDown, FaSignOutAlt } from 'react-icons/fa';
import { GiAvoidance } from 'react-icons/gi';
import { GrSchedules } from 'react-icons/gr';
import { HiOutlineDocument } from 'react-icons/hi';
import { HiMiniShoppingCart } from 'react-icons/hi2';
import { LuBellElectric, LuBookHeart, LuBookImage, LuCalendarHeart, LuFootprints, LuUser, LuX } from 'react-icons/lu';
import { MdOutlineInventory, MdOutlinePayments } from 'react-icons/md';
import { RiAdminFill } from 'react-icons/ri';
import { SiReasonstudios } from 'react-icons/si';
import { TbManualGearbox } from 'react-icons/tb';
import { TfiAgenda } from 'react-icons/tfi';
import { useLocation, useNavigate } from 'react-router';

import { MenuItem, NavItem } from './navbar';

import { LanguageSelector } from '@components/navigation/language-selector';
import { Isotype, Logotype } from '@components/svg';
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
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth();

  const authenticatedPrimaryMenuItems: Array<NavItem> = [
    {
      to: PageURLS.profile.root,
      label: t('nav:profile'),
      requireAuthentication: true,
      featureFlags: [FEATURE_FLAG.isProfilePageEnabled],
      icon: LuUser,
    },
    {
      to: PageURLS.instructor.root,
      label: t('nav:mySchedule'),
      requireAuthentication: true,
      orPermissions: [...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE],
      featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isProfilePageEnabled],
      icon: GrSchedules,
    },
    {
      to: PageURLS.classes,
      label: t('nav:menuScheduleClass'),
      featureFlags: [FEATURE_FLAG.isClassesPageEnabled],
      icon: LuFootprints,
    },
    {
      to: PageURLS.profile.subscription,
      label: isAuthenticated ? t('nav:menuPlans') : t('nav:navPlans'),
      featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
      icon: LuBellElectric,
    },
    {
      to: PageURLS.profile.bookings,
      label: t('nav:menuBookings'),
      requireAuthentication: true,
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
      requireAuthentication: true,
      featureFlags: [FEATURE_FLAG.isFigureSavedPageEnabled],
      icon: LuBookHeart,
    },
    {
      to: PageURLS.admin.users,
      label: t('nav:adminMenu.users'),
      orPermissions: AdminPermissions.users,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: RiAdminFill,
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
        ...AdminPermissions.users,
        ...AdminPermissions.studioRental,
      ],
      icon: RiAdminFill,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
    },
    {
      to: PageURLS.admin.agenda,
      label: t('nav:adminMenu.agenda'),
      orPermissions: AdminPermissions.scheduleBuilder,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: TfiAgenda,
    },
    {
      to: PageURLS.admin.users,
      label: t('nav:adminMenu.users'),
      orPermissions: AdminPermissions.users,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: RiAdminFill,
    },
    {
      to: PageURLS.admin.scheduleBuilder,
      label: t('nav:adminMenu.scheduleBuilder'),
      orPermissions: AdminPermissions.scheduleBuilder,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: GrSchedules,
    },
    {
      to: PageURLS.admin.studioRental,
      label: t('nav:adminMenu.studioRental'),
      orPermissions: AdminPermissions.studioRental,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: SiReasonstudios,
    },
    {
      to: PageURLS.admin.reports,
      label: t('nav:adminMenu.reportsConfig'),
      orPermissions: AdminPermissions.reports,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: HiOutlineDocument,
    },
    {
      to: PageURLS.admin.inventory,
      label: t('nav:adminMenu.inventoryBilling'),
      orPermissions: AdminPermissions.inventory,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: MdOutlineInventory,
    },
    {
      to: PageURLS.admin.bookings,
      label: t('nav:adminMenu.manualBookings'),
      orPermissions: AdminPermissions.bookings,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: TbManualGearbox,
    },
    {
      to: PageURLS.admin.payments,
      label: t('nav:adminMenu.payments'),
      orPermissions: AdminPermissions.payments,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: MdOutlinePayments,
    },
    {
      to: PageURLS.admin.figures,
      label: t('nav:adminMenu.figures'),
      orPermissions: AdminPermissions.figures,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: GiAvoidance,
    },
    {
      to: PageURLS.admin.merch,
      label: t('nav:adminMenu.merchProducts'),
      orPermissions: AdminPermissions.merch,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: HiMiniShoppingCart,
    },
    {
      to: PageURLS.admin.merchPos,
      label: t('nav:adminMenu.merchPos'),
      orPermissions: AdminPermissions.merchPos,
      featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
      icon: FaCartArrowDown,
    },
  ];

  return (
    <AsideModal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName='p-0 h-full overflow-auto flex flex-col'
      noCloseButton
      size='340px'
    >
      <div className='p-4 flex items-center justify-between bg-accent/30'>
        <div className='flex items-center gap-2'>
          <span className='size-8 rounded-full grid place-content-center bg-primary'>
            <Isotype className='w-2/3 mx-auto' mainColor='var(--color-accent)' />
          </span>
          <Logotype className='h-5 text-primary' />
        </div>
        <button onClick={onClose} className='text-gray-500 hover:text-gray-900 cursor-pointer'>
          <LuX className='w-6 h-6' />
        </button>
      </div>

      <div className='flex-1 flex flex-col overflow-auto'>
        <nav className='p-4 pt-8 grid gap-4 overflow-y-auto'>
          <section className='grid gap-2'>
            {authenticatedPrimaryMenuItems.map((item, i) => (
              <MenuItem
                key={item.to}
                {...item}
                variant='aside'
                onNavigate={onClose}
                className='animate-in fade-in slide-in-from-left duration-300 fill-mode-both'
                style={{ animationDelay: `${50 * (i + 2)}ms` }}
              />
            ))}
          </section>

          {user?.isAdmin && (
            <section>
              <label
                className={cn(
                  'font-bold uppercase text-primary mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4',
                  'animate-in fade-in slide-in-from-left duration-300 fill-mode-both',
                )}
                style={{ animationDelay: `${50 * (2 + authenticatedPrimaryMenuItems.length)}ms` }}
              >
                <Line color='var(--color-primary-200)' />
                {t('nav:admin')}
                <Line color='var(--color-primary-200)' />
              </label>
              <section className='grid gap-2'>
                {adminMenuItems.map((item, i) => (
                  <MenuItem
                    key={item.to}
                    {...item}
                    variant='aside'
                    onNavigate={onClose}
                    className='animate-in fade-in slide-in-from-left duration-300 fill-mode-both'
                    style={{ animationDelay: `${50 * (i + 3 + authenticatedPrimaryMenuItems.length)}ms` }}
                  />
                ))}
              </section>
            </section>
          )}
        </nav>

        <LanguageSelector variant='buttons' />
      </div>

      <div className='p-4 grid bg-accent/30'>
        <Button
          color='primary'
          variant='text'
          onClick={() => {
            onClose();

            if (isAuthenticated) {
              logout();
              navigate(PageURLS.home, { replace: true });
            } else {
              navigate(PageURLS.auth.login, { replace: true, state: { from: location } });
            }
          }}
        >
          <FaSignOutAlt />
          {isAuthenticated ? t('nav:signOut') : t('nav:signIn')}
        </Button>
      </div>
    </AsideModal>
  );
}
