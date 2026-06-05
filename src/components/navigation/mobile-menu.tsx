import { useTranslation } from 'react-i18next';
import { LuShoppingBag, LuStore, LuX } from 'react-icons/lu';
import { Link, useLocation, useNavigate, NavLink } from 'react-router';

import { LanguageSelector } from './language-selector';

import { useAndPermissions, useAuth, useOrPermissions } from '@contexts';
import { AdminPermissions, InstructorPermissions, PERMISSION } from '@core/permissions';

import type { IconType } from 'react-icons';

interface NavItem {
  to: string;
  label: string;
  andPermissions?: Array<PERMISSION>;
  orPermissions?: Array<PERMISSION>;
  icon?: IconType;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: Array<NavItem>;
  cta: NavItem;
}

export function MobileMenu({ isOpen, onClose, navItems, cta }: MobileMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const canAccessInstructorDashboard = useOrPermissions([
    ...InstructorPermissions.dashboard,
    PERMISSION.SCHEDULE_MANAGE,
  ]);

  const profileLabel = user?.displayName || user?.fullName || user?.name || t('nav:profile');

  const authenticatedPrimaryMenuItems: Array<NavItem> = [
    {
      to: '/profile',
      label: profileLabel,
    },
    {
      to: '/classes',
      label: t('nav:menuScheduleClass'),
    },
    {
      to: '/my-account/subscription',
      label: t('nav:menuPlans'),
    },
    {
      to: '/my-account/bookings',
      label: t('nav:menuBookings'),
    },
    {
      to: '/figures',
      label: t('nav:menuFigures'),
    },
    {
      to: '/figure/saved',
      label: t('nav:menuProgress'),
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
    },
    {
      to: '/admin/agenda',
      label: t('nav:adminMenu.agenda'),
      orPermissions: AdminPermissions.scheduleBuilder,
    },
    {
      to: '/admin/schedule-builder',
      label: t('nav:adminMenu.scheduleBuilder'),
      orPermissions: AdminPermissions.scheduleBuilder,
    },
    {
      to: '/admin/studio-rental',
      label: t('nav:adminMenu.studioRental'),
      orPermissions: AdminPermissions.studioRental,
    },
    {
      to: '/admin/reports',
      label: t('nav:adminMenu.reportsConfig'),
      orPermissions: AdminPermissions.reports,
    },
    {
      to: '/admin/access',
      label: t('nav:adminMenu.accessManagement'),
      orPermissions: AdminPermissions.access,
    },
    {
      to: '/admin/inventory',
      label: t('nav:adminMenu.inventoryBilling'),
      orPermissions: AdminPermissions.inventory,
    },
    {
      to: '/admin/bookings',
      label: t('nav:adminMenu.manualBookings'),
      orPermissions: AdminPermissions.bookings,
    },
    {
      to: '/admin/payments',
      label: t('nav:adminMenu.payments'),
      orPermissions: AdminPermissions.payments,
    },
    {
      to: '/admin/figures',
      label: t('nav:figures'),
      orPermissions: AdminPermissions.figures,
    },
    {
      to: '/admin/merch',
      label: t('nav:adminMenu.merchProducts'),
      orPermissions: AdminPermissions.merch,
      icon: LuShoppingBag,
    },
    {
      to: '/admin/merch/pos',
      label: t('nav:adminMenu.merchPos'),
      orPermissions: AdminPermissions.merchPos,
      icon: LuStore,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 bg-gray-900 bg-opacity-50'>
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

        <div className='px-4 py-2 flex-1 flex flex-col min-h-0'>
          <nav className='space-y-4 overflow-y-auto'>
            {(isAuthenticated ? authenticatedPrimaryMenuItems : navItems).map(item => (
              <MenuItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                orPermissions={item.orPermissions}
                andPermissions={item.andPermissions}
              />
            ))}

            {!isAuthenticated && !navItems.some(item => item.to === cta.to) ? (
              <MenuItem
                key={cta.to}
                to={cta.to}
                label={cta.label}
                icon={cta.icon}
                orPermissions={cta.orPermissions}
                andPermissions={cta.andPermissions}
              />
            ) : null}

            {isAuthenticated && canAccessInstructorDashboard && (
              <Link
                to='/instructor/dashboard'
                className='block py-2 text-gray-600 hover:text-primary'
                onClick={onClose}
              >
                {t('nav:instructorPortal')}
              </Link>
            )}

            {isAuthenticated && adminMenuItems.length > 0 && (
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
                    />
                  );
                })}
              </div>
            )}

            {!isAuthenticated && cta.to !== '/auth/login' ? (
              <Link to='/auth/login' className='block py-2 text-gray-600 hover:text-primary' onClick={onClose}>
                {t('nav:signIn')}
              </Link>
            ) : null}
          </nav>

          <div className='mt-auto space-y-3 border-t pt-4'>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  onClose();
                  navigate('/', { replace: true });
                }}
                className='block w-full text-left py-2 text-gray-600 hover:text-primary'
              >
                {t('nav:signOut')}
              </button>
            ) : null}
            <LanguageSelector variant='buttons' />
          </div>
        </div>
      </div>
    </div>
  );
}

const MenuItem = ({ label, to, icon: Icon, orPermissions = [], andPermissions = [] }: NavItem) => {
  const haveOrPermissions = useOrPermissions(orPermissions);
  const haveAndPermissions = useAndPermissions(andPermissions);
  const { pathname, hash } = useLocation();

  if (!haveOrPermissions || !haveAndPermissions) return null;

  const isItemActive = (to: string) => {
    if (to.startsWith('/#')) {
      return pathname === '/' && hash === to.slice(1);
    }

    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-2 pl-4 py-1 transition ${
        isItemActive(to) ? 'font-semibold text-primary' : 'text-gray-600 hover:text-primary'
      }`}
    >
      {Icon ? <Icon className='h-4 w-4' /> : null}
      {label}
    </NavLink>
  );
};
