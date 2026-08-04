import { AsideModal, Button, Line } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';
import { FaCartArrowDown, FaSignOutAlt } from 'react-icons/fa';
import { GiAvoidance } from 'react-icons/gi';
import { GrSchedules } from 'react-icons/gr';
import { HiOutlineDocument } from 'react-icons/hi';
import { HiMiniShoppingCart } from 'react-icons/hi2';
import { LuX } from 'react-icons/lu';
import { MdOutlineInventory, MdOutlinePayments } from 'react-icons/md';
import { RiAdminFill } from 'react-icons/ri';
import { SiReasonstudios } from 'react-icons/si';
import { TbManualGearbox } from 'react-icons/tb';
import { TfiAgenda } from 'react-icons/tfi';
import { useLocation, useNavigate } from 'react-router';

import { getAdminNavItem, getMobileProfileNavItem, getPrimaryNavItems, type NavItem } from './nav-items';
import { MenuItem } from './navbar';

import { LanguageSelector } from '@components/navigation/language-selector';
import { Isotype, Logotype } from '@components/svg';
import { FEATURE_FLAG, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth();

  const primaryMenuItems: Array<NavItem> = [
    ...(isAuthenticated ? [getMobileProfileNavItem(t)] : []),
    ...getPrimaryNavItems(t, { isAuthenticated, includeAdmin: false }),
  ];

  const adminMenuItems: Array<NavItem> = [
    getAdminNavItem(t),
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
            {primaryMenuItems.map((item, i) => (
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
                style={{ animationDelay: `${50 * (2 + primaryMenuItems.length)}ms` }}
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
                    style={{ animationDelay: `${50 * (i + 3 + primaryMenuItems.length)}ms` }}
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
