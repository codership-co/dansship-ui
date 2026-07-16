import { Button } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMenu } from 'react-icons/md';
import { NavLink, NavLinkProps, useLocation } from 'react-router';

import { MobileMenu } from './mobile-menu';

import { Section } from '@components/containers';
import { LanguageSelector } from '@components/navigation/language-selector';
import { Isotype } from '@components/svg';
import { ProfilePicture } from '@components/ui';
import { FEATURE_FLAG, useAuth, useEnabledFeatureFlag, useFeatureFlags, usePermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions, PERMISSION } from '@core/permissions';
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
  const location = useLocation();
  const { isAuthenticated, requireOnboarding } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { response } = usePromise(
    () => DansshipAPI.subscriptions.getMySubscriptions(),
    isAuthenticated && !requireOnboarding,
  );
  const { isLoginPageEnabled, isMyAccountBookingsPageEnabled, isMyAccountSubscriptionPageEnabled } = useFeatureFlags();

  const hasActivePlan = (response?.data?.summary?.active_count ?? 0) > 0;

  const navLinks: Array<NavItem> = [
    { to: PageURLS.classes, label: t('nav:menuScheduleClass'), featureFlags: [FEATURE_FLAG.isClassesPageEnabled] },
    {
      to: isAuthenticated ? PageURLS.profile.subscription : '/#planes',
      label: isAuthenticated ? t('nav:menuPlans') : t('nav:navPlans'),
      featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
    },
    { to: PageURLS.figures, label: t('nav:menuFigures'), featureFlags: [FEATURE_FLAG.isFiguresPageEnabled] },
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
        ...AdminPermissions.studioRental,
      ],
      featureFlags: [FEATURE_FLAG.isAdminPageEnabled],
    },
  ];

  return (
    <Section
      fullOnMobile
      className='fixed w-full top-0 left-0 z-50 sm:pt-4'
      contentClassName={cn(
        'sm:rounded-[1.25rem] bg-white/60 shadow-[0_10px_32px_-16px_rgba(88,47,89,0.35)] backdrop-blur-md',
        'flex min-h-16 items-center justify-between gap-8 px-4 sm:px-6',
      )}
    >
      <div className='flex items-center gap-4'>
        <Button
          forIcon
          size='small'
          variant='text'
          className={isAuthenticated ? '' : 'lg:hidden'}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label={t('nav:menu')}
        >
          <MdMenu className='h-6 w-6' />
        </Button>

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

      <div className='ml-auto flex items-center justify-end gap-2 sm:gap-4'>
        <LanguageSelector variant='dropdown' />
        {!isAuthenticated && isLoginPageEnabled && (
          <NavLink to={PageURLS.auth.login} state={{ from: location }}>
            <Button color='primary' size='small' className='hidden xs:block'>
              {t('nav:signIn')}
            </Button>
          </NavLink>
        )}
        {isAuthenticated && hasActivePlan && isMyAccountBookingsPageEnabled && (
          <NavLink to={PageURLS.profile.bookings}>
            <Button color='primary' size='small' className='hidden xs:block'>
              {t('nav:myBookings')}
            </Button>
          </NavLink>
        )}
        {isAuthenticated && !hasActivePlan && isMyAccountSubscriptionPageEnabled && (
          <NavLink to={PageURLS.profile.subscription}>
            <Button color='primary' size='small' className='hidden xs:block'>
              {t('nav:buy')}
            </Button>
          </NavLink>
        )}
        {isAuthenticated && (
          <NavLink to={PageURLS.profile.root} end>
            {({ isActive }) => (
              <ProfilePicture
                className={cn(
                  'size-10 rounded-full cursor-pointer border-2 border-transparent hover:border-primary transition-[border]',
                  isActive && 'border-primary',
                )}
              />
            )}
          </NavLink>
        )}
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </Section>
  );
};

interface MenuItemProps extends NavItem {
  variant: 'navbar' | 'aside';
  className?: string;
  style?: React.CSSProperties;
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
  className,
  style,
}: MenuItemProps) => {
  const { isAuthenticated } = useAuth();
  const havePermissions = usePermissions({ orPermissions, andPermissions });
  const featureFlagsEnabled = useEnabledFeatureFlag(featureFlags);

  if (!featureFlagsEnabled) return null;

  if (requireAuthentication && !isAuthenticated) return null;

  if (!havePermissions) return null;

  const navbarClassName: NavLinkProps['className'] = ({ isActive }) =>
    cn(
      'relative font-semibold transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-0.75 after:w-full after:rounded-full after:bg-primary after:transition-transform after:duration-200',
      isActive && 'text-primary after:scale-x-100',
      !isActive && 'text-foreground/80 after:scale-x-0 hover:text-primary hover:after:scale-x-100',
      className,
    );

  const asideClassName: NavLinkProps['className'] = ({ isActive }) =>
    cn(
      'flex items-center gap-2 transition-all py-2 px-4 rounded-lg relative',
      isActive && 'bg-primary/20 font-semibold text-primary',
      !isActive && 'hover:bg-primary/10 hover:pl-6 text-gray-600 hover:text-primary',
      className,
    );

  return (
    <NavLink to={to} className={variant === 'navbar' ? navbarClassName : asideClassName} style={style} end>
      {Icon ? <Icon className='h-4 w-4' /> : null}
      {label}
    </NavLink>
  );
};
