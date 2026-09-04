import { GrSchedules } from 'react-icons/gr';
import { LuBellElectric, LuBookImage, LuCalendarHeart, LuDoorOpen, LuFootprints, LuUser } from 'react-icons/lu';

import { FEATURE_FLAG } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminInventoryPagePermissions, AdminPermissions, InstructorPermissions, PERMISSION } from '@core/permissions';

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

type Translate = (key: string) => string;

interface PrimaryNavOptions {
  isAuthenticated: boolean;
}

/** Permissions that reveal the hamburger Admin section. */
export function getAdminMenuPermissions(): Array<PERMISSION> {
  return [
    ...AdminPermissions.scheduleBuilder,
    ...AdminPermissions.scheduleManage,
    ...AdminInventoryPagePermissions,
    ...AdminPermissions.bookings,
    ...AdminPermissions.payments,
    ...AdminPermissions.merch,
    ...AdminPermissions.merchPos,
    ...AdminPermissions.figures,
    ...AdminPermissions.reports,
    ...AdminPermissions.users,
    ...AdminPermissions.studioRental,
    ...AdminPermissions.campaigns,
  ];
}

export function getScheduleBuilderNavItem(t: Translate): NavItem {
  return {
    to: PageURLS.admin.scheduleBuilder,
    label: t('nav:adminMenu.scheduleBuilder'),
    orPermissions: AdminPermissions.scheduleBuilder,
    featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
    icon: GrSchedules,
  };
}

/**
 * Shared primary nav for desktop + mobile.
 * Guest: Classes → Plans → Figures
 * Signed-in: Mi Horario (instructor) → Classes → Bookings → Studio rental → Plans→subscription
 * Figuras/Progreso omitted when authenticated (not prod-ready).
 */
export function getPrimaryNavItems(t: Translate, { isAuthenticated }: PrimaryNavOptions): Array<NavItem> {
  return !isAuthenticated
    ? [
        {
          to: PageURLS.classes,
          label: t('nav:menuScheduleClass'),
          featureFlags: [FEATURE_FLAG.isClassesPageEnabled],
          icon: LuFootprints,
        },
        {
          to: PageURLS.plans,
          label: t('nav:navPlans'),
          featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
          icon: LuBellElectric,
        },
        {
          to: PageURLS.figures,
          label: t('nav:menuFigures'),
          featureFlags: [FEATURE_FLAG.isFiguresPageEnabled],
          icon: LuBookImage,
        },
      ]
    : [
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
          to: PageURLS.profile.bookings,
          label: t('nav:menuBookings'),
          requireAuthentication: true,
          featureFlags: [FEATURE_FLAG.isMyAccountBookingsPageEnabled],
          icon: LuCalendarHeart,
        },
        {
          to: PageURLS.studioRentalBrowse,
          label: t('nav:studioRental'),
          requireAuthentication: true,
          featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalBrowsePageEnabled],
          icon: LuDoorOpen,
        },
        {
          to: PageURLS.profile.subscription,
          label: t('nav:navPlans'),
          requireAuthentication: true,
          featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
          icon: LuBellElectric,
        },
      ];
}

/** Mobile-only profile entry prepended for signed-in users. */
export function getMobileProfileNavItem(t: Translate): NavItem {
  return {
    to: PageURLS.profile.root,
    label: t('nav:profile'),
    requireAuthentication: true,
    featureFlags: [FEATURE_FLAG.isProfilePageEnabled],
    icon: LuUser,
  };
}
