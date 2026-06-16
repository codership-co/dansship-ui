export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
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
  { value: 'spouse', label: 'auth:onboarding.relativeOptions.spouse' },
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

export const PageURLS = {
  home: '/',
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    verifyEmail: '/auth/verify-email',
    resetPassword: '/auth/reset-password',
    onboarding: '/auth/onboarding',
  },
  userId: (id: number) => `/user/${id}`,
  figures: '/figures',
  figuresById: (id: number) => `/figures/${id}`,
  browse: '/browse',
  classes: '/classes',
  instructorDashboard: '/instructor/dashboard',
  profile: '/profile',
  profileEdit: '/profile/edit',
  figureCompleted: '/figure/completed',
  figureSaved: '/figure/saved',
  myAccountSubscription: '/my-account/subscription',
  myAccountBookings: '/my-account/bookings',
  studioRentalBrowse: '/studio-rental/browse',
  studioRentalRequests: '/studio-rental/requests',
  admin: {
    root: '/admin',
    agenda: '/admin/agenda',
    agendaConflicts: '/admin/agenda/conflicts',
    inventory: '/admin/inventory',
    scheduleBuilder: '/admin/schedule-builder',
    reports: '/admin/reports',
    bookings: '/admin/bookings',
    payments: '/admin/payments',
    merch: '/admin/merch',
    merchPos: '/admin/merch/pos',
    figures: '/admin/figures',
    access: '/admin/access',
    studioRental: '/admin/studio-rental',
  },
} as const;
