import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMenu } from 'react-icons/md';
import { NavLink, NavLinkProps } from 'react-router';

import { LanguageSelector } from './language-selector';
import { MobileMenu } from './mobile-menu';

import { Isotype } from '@components/svg';
import { Button } from '@components/ui';
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

  const hasActivePlan = response?.data?.summary?.active_count ?? 0 > 0;

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
    <nav className='fixed w-full top-0 left-0 z-50 px-3 pb-2 pt-3 sm:px-5'>
      <div className='mx-auto max-w-350 rounded-[1.25rem] bg-white/90 shadow-[0_10px_32px_-16px_rgba(88,47,89,0.35)] backdrop-blur-xl'>
        <div className='flex min-h-16 items-center justify-between gap-8 px-4 sm:px-6'>
          <div className='flex items-center gap-2'>
            {isAuthenticated ? (
              <Button size='icon' variant='ghost' onClick={() => setIsMobileMenuOpen(true)} aria-label={t('nav:menu')}>
                <MdMenu className='h-6 w-6' />
              </Button>
            ) : null}

            <NavLink
              to={PageURLS.home}
              className='inline-flex items-center text-header4 text-primary font-brand hover:text-primary-300 transition-[all_300ms-ease]'
            >
              <Isotype className='transition-[all_3000ms_ease] h-7 hover:drop-shadow-[0_0_16px_var(--color-primary-300)]' />
            </NavLink>
          </div>

          <div className='hidden items-center gap-8 lg:flex'>
            {navLinks.map(item => (
              <MenuItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                orPermissions={item.orPermissions}
                andPermissions={item.andPermissions}
                className={({ isActive }) =>
                  `relative font-semibold tracking-tight transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-0.75 after:w-full after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
                    isActive
                      ? 'text-primary after:scale-x-100'
                      : 'text-foreground/80 after:scale-x-0 hover:text-primary hover:after:scale-x-100'
                  }`
                }
              />
            ))}
          </div>

          <div className='ml-auto flex items-center justify-end gap-1.5 sm:gap-2'>
            <LanguageSelector variant='dropdown' />
            {!isAuthenticated && isLoginPageEnabled && (
              <Button asChild>
                <NavLink to={PageURLS.auth.login}>{t('nav:signIn')}</NavLink>
              </Button>
            )}
            {isAuthenticated && hasActivePlan && isMyAccountBookingsPageEnabled && (
              <Button asChild>
                <NavLink to={PageURLS.myAccountBookings}>{t('nav:myBookings')}</NavLink>
              </Button>
            )}
            {isAuthenticated && !hasActivePlan && isMyAccountSubscriptionPageEnabled && (
              <Button asChild>
                <NavLink to={PageURLS.myAccountSubscription}>{t('nav:buy')}</NavLink>
              </Button>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated ? <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} /> : null}
    </nav>
  );
};

interface MenuItemProps extends NavItem {
  className?: NavLinkProps['className'];
}

export const MenuItem = ({
  label,
  to,
  icon: Icon,
  orPermissions = [],
  andPermissions = [],
  featureFlags = [],
  className,
  requireAuthentication,
}: MenuItemProps) => {
  const { isAuthenticated } = useAuth();
  const havePermissions = usePermissions({ orPermissions, andPermissions });
  const featureFlagsEnabled = useEnabledFeatureFlag(featureFlags);

  if (featureFlagsEnabled) return null;

  if (requireAuthentication && !isAuthenticated) return null;

  if (!havePermissions) return null;

  return (
    <NavLink to={to} className={className}>
      {Icon ? <Icon className='h-4 w-4' /> : null}
      {label}
    </NavLink>
  );
};
