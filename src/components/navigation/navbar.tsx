import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMenu } from 'react-icons/md';
import { NavLink, NavLinkProps } from 'react-router';

import { MobileMenu } from './mobile-menu';

import { Isotype } from '@components/svg';
import { FEATURE_FLAG, useAuth, useEnabledFeatureFlag, useFeatureFlags, usePermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions, InstructorPermissions, PERMISSION } from '@core/permissions';
import { usePromise } from '@hooks';

import type { IconType } from 'react-icons';

export interface NavItem {
  to: string;
  label: string;
  andPermissions?: Array<PERMISSION>;
  orPermissions?: Array<PERMISSION>;
  featureFlags?: Array<FEATURE_FLAG>;
  requireAuthentication?: boolean;
  icon?: IconType;
}

export const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, requireOnboarding } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { response } = usePromise(
    () => DansshipAPI.subscriptions.getMySubscriptions(),
    isAuthenticated && !requireOnboarding,
  );
  const { isLoginPageEnabled, isMyAccountBookingsPageEnabled, isMyAccountSubscriptionPageEnabled } = useFeatureFlags();

  const hasActivePlan = (response?.data?.summary?.active_count ?? 0) > 0;

  const navLinks: Array<NavItem> = [
    { to: PageURLS.figures, label: t('nav:menuFigures'), featureFlags: [FEATURE_FLAG.isFiguresPageEnabled] },
    { to: PageURLS.classes, label: t('nav:menuScheduleClass'), featureFlags: [FEATURE_FLAG.isClassesPageEnabled] },
    {
      to: isAuthenticated ? PageURLS.myAccountSubscription : '/#planes',
      label: t('nav:menuPlans'),
      featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
    },
    {
      to: PageURLS.instructorDashboard,
      label: t('nav:instructorPortal'),
      orPermissions: [...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE],
      featureFlags: [FEATURE_FLAG.isInstructorDashboardPageEnabled],
    },
    {
      to: PageURLS.admin.root,
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
  ];

  return (
    <nav className='fixed w-full top-0 left-0 z-50 sm:pt-3 sm:px-5'>
      <div className='mx-auto max-w-7xl sm:rounded-[1.25rem] bg-white/90 shadow-[0_10px_32px_-16px_rgba(88,47,89,0.35)] backdrop-blur-xl'>
        <div className='flex min-h-16 items-center justify-between gap-8 px-4 sm:px-6'>
          <div className='flex items-center gap-6'>
            {isAuthenticated ? (
              <Button
                forIcon
                size='small'
                variant='text'
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label={t('nav:menu')}
              >
                <MdMenu className='h-6 w-6' />
              </Button>
            ) : null}

            <NavLink
              to={PageURLS.home}
              className='inline-flex items-center text-header4 text-primary font-brand hover:text-primary-300 transition-[all_300ms-ease]'
            >
              <Isotype className='transition-[all_3000ms_ease] h-7' />
            </NavLink>
          </div>

          <div className='hidden items-center gap-8 lg:flex'>
            {navLinks.map(item => (
              <MenuItem key={item.to} {...item} variant='navbar' />
            ))}
          </div>

          <div className='ml-auto flex items-center justify-end gap-1.5 sm:gap-2'>
            {/*<LanguageSelector variant='dropdown' />*/}
            {!isAuthenticated && isLoginPageEnabled && (
              <NavLink to={PageURLS.auth.login}>
                <Button color='primary' size='small'>
                  {t('nav:signIn')}
                </Button>
              </NavLink>
            )}
            {isAuthenticated && hasActivePlan && isMyAccountBookingsPageEnabled && (
              <NavLink to={PageURLS.myAccountBookings}>
                <Button color='primary' size='small'>
                  {t('nav:myBookings')}
                </Button>
              </NavLink>
            )}
            {isAuthenticated && !hasActivePlan && isMyAccountSubscriptionPageEnabled && (
              <NavLink to={PageURLS.myAccountSubscription}>
                <Button color='primary' size='small'>
                  {t('nav:buy')}
                </Button>
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated ? <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} /> : null}
    </nav>
  );
};

interface MenuItemProps extends NavItem {
  variant: 'navbar' | 'aside';
}

export const MenuItem = ({
  label,
  to,
  icon: Icon,
  orPermissions = [],
  andPermissions = [],
  featureFlags = [],
  requireAuthentication,
  variant,
}: MenuItemProps) => {
  const { isAuthenticated } = useAuth();
  const havePermissions = usePermissions({ orPermissions, andPermissions });
  const featureFlagsEnabled = useEnabledFeatureFlag(featureFlags);

  if (!featureFlagsEnabled) return null;

  if (requireAuthentication && !isAuthenticated) return null;

  if (!havePermissions) return null;

  const navbarClassName: NavLinkProps['className'] = ({ isActive }) =>
    `relative font-semibold tracking-tight transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-0.75 after:w-full after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
      isActive
        ? 'text-primary after:scale-x-100'
        : 'text-foreground/80 after:scale-x-0 hover:text-primary hover:after:scale-x-100'
    }`;

  const asideClassName: NavLinkProps['className'] = ({ isActive }) =>
    `flex items-center gap-2 transition-all after:transition-all pl-2 relative after:rounded-full after:bg-primary-500 after:absolute after:content-[''] after:left-2 after:top-1/2 after:-translate-y-1/2 ${
      isActive
        ? 'after:w-1 after:h-1 pl-6 font-semibold text-primary'
        : 'hover:after:w-1 hover:after:h-1 hover:pl-6 text-gray-600 hover:text-primary'
    }`;

  return (
    <NavLink to={to} className={variant === 'navbar' ? navbarClassName : asideClassName} end>
      {Icon ? <Icon className='h-4 w-4' /> : null}
      {label}
    </NavLink>
  );
};
