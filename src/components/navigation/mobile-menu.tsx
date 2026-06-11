import { useTranslation } from 'react-i18next';
import { LuShoppingBag, LuStore, LuX } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { LanguageSelector } from './language-selector';
import { MenuItem, NavItem } from './navbar';

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
  const { logout } = useAuth();

  const authenticatedPrimaryMenuItems: Array<NavItem> = [
    {
      to: PageURLS.profile,
      label: t('nav:profile'),
      featureFlags: [FEATURE_FLAG.isProfilePageEnabled],
    },
    {
      to: PageURLS.classes,
      label: t('nav:menuScheduleClass'),
      featureFlags: [FEATURE_FLAG.isClassesPageEnabled],
    },
    {
      to: PageURLS.myAccountSubscription,
      label: t('nav:menuPlans'),
      featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
    },
    {
      to: PageURLS.myAccountBookings,
      label: t('nav:menuBookings'),
      featureFlags: [FEATURE_FLAG.isMyAccountBookingsPageEnabled],
    },
    {
      to: PageURLS.figures,
      label: t('nav:menuFigures'),
      featureFlags: [FEATURE_FLAG.isFiguresPageEnabled],
    },
    {
      to: PageURLS.figureSaved,
      label: t('nav:menuProgress'),
      featureFlags: [FEATURE_FLAG.isFigureSavedPageEnabled],
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
      featureFlags: [FEATURE_FLAG.isAdminPageEnabled],
    },
    {
      to: PageURLS.admin.agenda,
      label: t('nav:adminMenu.agenda'),
      orPermissions: AdminPermissions.scheduleBuilder,
      featureFlags: [FEATURE_FLAG.isAdminAgendaPageEnabled],
    },
    {
      to: PageURLS.admin.scheduleBuilder,
      label: t('nav:adminMenu.scheduleBuilder'),
      orPermissions: AdminPermissions.scheduleBuilder,
      featureFlags: [FEATURE_FLAG.isAdminScheduleBuilderPageEnabled],
    },
    {
      to: PageURLS.admin.studioRental,
      label: t('nav:adminMenu.studioRental'),
      orPermissions: AdminPermissions.studioRental,
      featureFlags: [FEATURE_FLAG.isAdminStudioRentalPageEnabled],
    },
    {
      to: PageURLS.admin.reports,
      label: t('nav:adminMenu.reportsConfig'),
      orPermissions: AdminPermissions.reports,
      featureFlags: [FEATURE_FLAG.isAdminReportsPageEnabled],
    },
    {
      to: PageURLS.admin.access,
      label: t('nav:adminMenu.accessManagement'),
      orPermissions: AdminPermissions.access,
      featureFlags: [FEATURE_FLAG.isAdminAccessPageEnabled],
    },
    {
      to: PageURLS.admin.inventory,
      label: t('nav:adminMenu.inventoryBilling'),
      orPermissions: AdminPermissions.inventory,
      featureFlags: [FEATURE_FLAG.isAdminInventoryPageEnabled],
    },
    {
      to: PageURLS.admin.bookings,
      label: t('nav:adminMenu.manualBookings'),
      orPermissions: AdminPermissions.bookings,
      featureFlags: [FEATURE_FLAG.isAdminBookingsPageEnabled],
    },
    {
      to: PageURLS.admin.payments,
      label: t('nav:adminMenu.payments'),
      orPermissions: AdminPermissions.payments,
      featureFlags: [FEATURE_FLAG.isAdminPaymentsPageEnabled],
    },
    {
      to: PageURLS.admin.figures,
      label: t('nav:figures'),
      orPermissions: AdminPermissions.figures,
      featureFlags: [FEATURE_FLAG.isAdminFiguresPageEnabled],
    },
    {
      to: PageURLS.admin.merch,
      label: t('nav:adminMenu.merchProducts'),
      orPermissions: AdminPermissions.merch,
      featureFlags: [FEATURE_FLAG.isAdminMerchPageEnabled],
      icon: LuShoppingBag,
    },
    {
      to: PageURLS.admin.merchPos,
      label: t('nav:adminMenu.merchPos'),
      orPermissions: AdminPermissions.merchPos,
      featureFlags: [FEATURE_FLAG.isAdminMerchPosPageEnabled],
      icon: LuStore,
    },
    {
      to: PageURLS.instructorDashboard,
      label: t('nav:instructorPortal'),
      orPermissions: [...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE],
      featureFlags: [FEATURE_FLAG.isInstructorDashboardPageEnabled],
      icon: LuStore,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 bg-gray-900/50' onClick={onClose}>
      <div className='fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col'>
        <div className='p-4 flex items-center justify-between border-b'>
          <div className='flex items-center gap-2'>
            <img src='/assets/images/logo.png' alt='Danssip' className='h-6 w-auto' />
            <img src='/assets/images/logotipo.png' alt='Dansship' className='h-5 w-auto' />
          </div>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            <LuX className='w-6 h-6' />
          </button>
        </div>

        <div className='p-4 flex-1 flex flex-col min-h-0'>
          <nav className='space-y-4 overflow-y-auto'>
            {authenticatedPrimaryMenuItems.map(item => (
              <MenuItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                orPermissions={item.orPermissions}
                andPermissions={item.andPermissions}
                className={({ isActive }) =>
                  `flex items-center gap-2 transition-all after:transition-all pl-2 relative after:rounded-full after:bg-primary-500 after:absolute after:content-[''] after:left-2 after:top-1/2 after:-translate-y-1/2 ${
                    isActive
                      ? 'after:w-1 after:h-1 pl-6 font-semibold text-primary'
                      : 'hover:after:w-1 hover:after:h-1 hover:pl-6 text-gray-600 hover:text-primary'
                  }`
                }
              />
            ))}

            <div className='py-2 space-y-2'>
              <span className='text-sm font-bold text-gray-400 uppercase tracking-wider'>{t('nav:admin')}</span>
              {adminMenuItems.map(item => {
                return (
                  <MenuItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    orPermissions={item.orPermissions}
                    andPermissions={item.andPermissions}
                    className={({ isActive }) =>
                      `flex items-center gap-2 transition-all after:transition-all pl-2 relative after:rounded-full after:bg-primary-500 after:absolute after:content-[''] after:left-2 after:top-1/2 after:-translate-y-1/2 ${
                        isActive
                          ? 'after:w-1 after:h-1 pl-6 font-semibold text-primary'
                          : 'hover:after:w-1 hover:after:h-1 hover:pl-6 text-gray-600 hover:text-primary'
                      }`
                    }
                  />
                );
              })}
            </div>
          </nav>

          <div className='mt-auto space-y-3 pt-4'>
            <LanguageSelector variant='buttons' />
          </div>
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
      </div>
    </div>
  );
}
