import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMenu } from 'react-icons/md';
import { NavLink, useLocation } from 'react-router';

import { LanguageSelector } from './language-selector';
import { MobileMenu } from './mobile-menu';

import { Button } from '@components/ui';
import { useAuth, useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { AdminPermissions, InstructorPermissions, PERMISSION } from '@core/permissions';
import { usePromise } from '@hooks';

interface NavItem {
  to: string;
  label: string;
}

export const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { pathname, hash } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { response } = usePromise(
    () => DansshipAPI.subscriptions.getMySubscriptions(),
    isAuthenticated && !user?.requiresOnboarding && !user?.onboardingRequired,
  );

  const canAccessInstructorDashboard = useOrPermissions([
    ...InstructorPermissions.dashboard,
    PERMISSION.SCHEDULE_MANAGE,
  ]);

  const canAccessAnyAdminArea = useOrPermissions([
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
  ]);

  const hasActivePlan = response?.data?.summary.active_count > 0;
  const plansPath = isAuthenticated ? '/my-account/subscription' : '/#planes';

  const adminHomePath = '/admin';

  const navLinks: Array<NavItem> = [
    { to: '/figures', label: t('nav:menuFigures') },
    { to: '/classes', label: t('nav:menuScheduleClass') },
    { to: plansPath, label: t('nav:menuPlans') },
  ];

  const cta = !isAuthenticated
    ? { to: '/auth/login', label: t('nav:signIn') }
    : hasActivePlan
      ? { to: '/my-account/bookings', label: t('nav:myBookings') }
      : { to: '/my-account/subscription', label: t('nav:buy') };

  const isItemActive = (to: string) => {
    if (to.startsWith('/#')) {
      return pathname === '/' && hash === to.slice(1);
    }

    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <nav className='sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-5'>
      <div className='mx-auto max-w-350 rounded-[1.25rem] bg-white/90 shadow-[0_10px_32px_-16px_rgba(88,47,89,0.35)] backdrop-blur-xl'>
        <div className='flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6'>
          <div className='flex items-center gap-2'>
            {isAuthenticated ? (
              <Button size='icon' onClick={() => setIsMobileMenuOpen(true)} aria-label={t('nav:menu')}>
                <MdMenu className='h-6 w-6' />
              </Button>
            ) : null}

            <NavLink to='/' className='inline-flex items-center text-primary'>
              <img src='/assets/images/logotipo.png' alt='Dansship' className='h-7 w-auto sm:h-8' />
            </NavLink>
          </div>

          <div className='hidden items-center gap-8 lg:flex'>
            {navLinks.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative pb-1 font-semibold tracking-tight transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-0.75 after:w-full after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
                  isItemActive(item.to)
                    ? 'text-primary after:scale-x-100'
                    : 'text-foreground/80 after:scale-x-0 hover:text-primary hover:after:scale-x-100'
                }`}
              >
                {item.label}
              </NavLink>
            ))}

            {canAccessInstructorDashboard ? (
              <NavLink
                to='/instructor/dashboard'
                className={`relative pb-1 font-semibold tracking-tight transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-0.75 after:w-full after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
                  isItemActive('/instructor/dashboard')
                    ? 'text-primary after:scale-x-100'
                    : 'text-foreground/80 after:scale-x-0 hover:text-primary hover:after:scale-x-100'
                }`}
              >
                {t('nav:instructorPortal')}
              </NavLink>
            ) : null}

            {canAccessAnyAdminArea ? (
              <NavLink
                to={adminHomePath}
                className={`relative pb-1 font-semibold tracking-tight transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-0.75 after:w-full after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
                  pathname.startsWith('/admin')
                    ? 'text-primary after:scale-x-100'
                    : 'text-foreground/80 after:scale-x-0 hover:text-primary hover:after:scale-x-100'
                }`}
              >
                {t('nav:admin', { defaultValue: 'Admin' })}
              </NavLink>
            ) : null}
          </div>

          <div className='ml-auto flex items-center justify-end gap-1.5 sm:gap-2'>
            {!isAuthenticated || user?.requiresOnboarding || user?.onboardingRequired ? (
              <LanguageSelector variant='dropdown' />
            ) : null}
            <Button asChild>
              <NavLink to={cta.to}>{cta.label}</NavLink>
            </Button>
          </div>
        </div>
      </div>

      {isAuthenticated ? (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navItems={navLinks}
          cta={cta}
        />
      ) : null}
    </nav>
  );
};
