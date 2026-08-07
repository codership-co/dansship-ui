import { GrSchedules } from 'react-icons/gr';
import { LuBellElectric, LuBookImage, LuCalendarHeart, LuFootprints, LuUser } from 'react-icons/lu';
import { RiAdminFill } from 'react-icons/ri';

import { FEATURE_FLAG } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, InstructorPermissions, PERMISSION } from '@core/permissions';

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
  /** Desktop center nav includes Admin; mobile keeps Admin in its own section. */
  includeAdmin?: boolean;
}

export function getAdminNavItem(t: Translate): NavItem {
  return {
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
      ...AdminPermissions.users,
      ...AdminPermissions.studioRental,
      ...AdminPermissions.doorCode,
    ],
    featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
    icon: RiAdminFill,
  };
}

/**
 * Shared primary nav for desktop + mobile.
 * Guest: Classes → Plans → Figures
 * Signed-in: Mi Horario (instructor) → Classes → Bookings → Plans→subscription
 * Figuras/Progreso omitted when authenticated (not prod-ready).
 */
export function getPrimaryNavItems(
  t: Translate,
  { isAuthenticated, includeAdmin = true }: PrimaryNavOptions,
): Array<NavItem> {
  const items: Array<NavItem> = !isAuthenticated
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
          to: PageURLS.profile.subscription,
          label: t('nav:navPlans'),
          requireAuthentication: true,
          featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
          icon: LuBellElectric,
        },
      ];

  if (includeAdmin) {
    items.push(getAdminNavItem(t));
  }

  return items;
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
