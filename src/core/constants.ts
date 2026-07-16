export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  // { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const languageCodes = languages.map(l => l.code);
export type LanguageCode = (typeof languageCodes)[number];
export const defaultLanguage = languages[0];

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'auth:onboarding.documentTypeOptions.CC' },
  { value: 'CE', label: 'auth:onboarding.documentTypeOptions.CE' },
  { value: 'PA', label: 'auth:onboarding.documentTypeOptions.PA' },
  { value: 'TI', label: 'auth:onboarding.documentTypeOptions.TI' },
];

export const COUNTRY_CODE_OPTIONS = [
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+52', label: '🇲🇽 +52' },
];

export const RELATIVE_OPTIONS = [
  { value: 'mother', label: 'auth:onboarding.relativeOptions.mother' },
  { value: 'father', label: 'auth:onboarding.relativeOptions.father' },
  { value: 'sibling', label: 'auth:onboarding.relativeOptions.sibling' },
  { value: 'couple', label: 'auth:onboarding.relativeOptions.couple' },
  { value: 'familiar', label: 'auth:onboarding.relativeOptions.familiar' },
  { value: 'friend', label: 'auth:onboarding.relativeOptions.friend' },
  { value: 'other', label: 'auth:onboarding.relativeOptions.other' },
];
export const DISCOVERY_OPTIONS = [
  { value: 'instagram', label: 'auth:onboarding.discoveryOptions.instagram' },
  { value: 'tiktok', label: 'auth:onboarding.discoveryOptions.tiktok' },
  { value: 'google', label: 'auth:onboarding.discoveryOptions.google' },
  { value: 'recomendation', label: 'auth:onboarding.discoveryOptions.recomendation' },
  { value: 'other', label: 'auth:onboarding.discoveryOptions.other' },
];
export const GOALS_OPTIONS = [
  { value: 'buildBody', label: 'auth:onboarding.goalsOptions.buildBody' },
  { value: 'reduceStress', label: 'auth:onboarding.goalsOptions.reduceStress' },
  { value: 'personalChallenge', label: 'auth:onboarding.goalsOptions.personalChallenge' },
  { value: 'joinCommunity', label: 'auth:onboarding.goalsOptions.joinCommunity' },
];
export const DISCIPLINES_OPTIONS = [
  { value: 'poleDance', label: 'auth:onboarding.disciplineOptions.poleDance' },
  { value: 'flexibility', label: 'auth:onboarding.disciplineOptions.flexibility' },
  { value: 'fabric', label: 'auth:onboarding.disciplineOptions.fabric' },
  { value: 'ring', label: 'auth:onboarding.disciplineOptions.ring' },
  { value: 'dance', label: 'auth:onboarding.disciplineOptions.dance' },
];
export const LEVEL_OPTIONS = [
  { value: 'never', label: 'auth:onboarding.levelOptions.never' },
  { value: 'beginner', label: 'auth:onboarding.levelOptions.beginner' },
  { value: 'intermediate', label: 'auth:onboarding.levelOptions.intermediate' },
  { value: 'advanced', label: 'auth:onboarding.levelOptions.advanced' },
];
export const SCHEDULE_OPTIONS = [
  { value: 'monFriFrom6to10', label: 'auth:onboarding.scheduleOptions.monFriFrom6to10' },
  { value: 'monFriFrom10to16', label: 'auth:onboarding.scheduleOptions.monFriFrom10to16' },
  { value: 'monFriFrom16to21', label: 'auth:onboarding.scheduleOptions.monFriFrom16to21' },
  { value: 'saturday', label: 'auth:onboarding.scheduleOptions.saturday' },
  { value: 'sunday', label: 'auth:onboarding.scheduleOptions.sunday' },
  { value: 'holidays', label: 'auth:onboarding.scheduleOptions.holidays' },
];

export const DAY_OF_WEEK_OPTIONS = [
  { value: 'monday', label: 'common:days.monday' },
  { value: 'tuesday', label: 'common:days.tuesday' },
  { value: 'wednesday', label: 'common:days.wednesday' },
  { value: 'thursday', label: 'common:days.thursday' },
  { value: 'friday', label: 'common:days.friday' },
  { value: 'saturday', label: 'common:days.saturday' },
  { value: 'sunday', label: 'common:days.sunday' },
] as const;

export const FORCE_INSTRUCTOR_ONBOARDING_KEY = 'force_instructor_onboarding';
export const AUTH_SESSION_KEY = 'auth_session';
export const AUTH_TOKEN_KEY = 'auth_token';

export const PageURLS = {
  home: '/',
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    verifyEmail: '/auth/verify-email',
    resetPassword: '/auth/reset-password',
    onboarding: '/auth/onboarding',
    instructorOnboarding: '/auth/instructor-onboarding',
  },
  profile: {
    root: '/profile',
    edit: '/profile/edit',
    subscription: '/profile/subscription',
    bookings: '/profile/bookings',
  },
  admin: {
    root: '/admin',
    agenda: '/admin/agenda',
    users: '/admin/users',
    userDetails: (userId: string | number) => `/admin/users/${userId}`,
    agendaConflicts: '/admin/agenda/conflicts',
    inventory: '/admin/inventory',
    scheduleBuilder: '/admin/schedule-builder',
    reports: '/admin/reports',
    bookings: '/admin/bookings',
    payments: '/admin/payments',
    merch: '/admin/merch',
    merchPos: '/admin/merch/pos',
    figures: '/admin/figures',
    studioRental: '/admin/studio-rental',
  },
  userId: (id: string | number) => `/user/${id}`,
  figures: '/figures',
  instructorInvite: '/instructor-onboarding',
  instructorDashboard: '/instructor/dashboard',
  figuresById: (id: string | number) => `/figures/${id}`,
  browse: '/browse',
  classes: '/classes',
  profileEdit: '/profile/edit',
  figureCompleted: '/figure/completed',
  figureSaved: '/figure/saved',
  paymentsResult: '/payments/result',
  studioRentalBrowse: '/studio-rental/browse',
  studioRentalRequests: '/studio-rental/requests',
} as const;
