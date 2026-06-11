export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const languageCodes = languages.map(l => l.code);
export type LanguageCode = (typeof languageCodes)[number];
export const defaultLanguage = languages[0];

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'C.C. (Cédula de Ciudadanía)' },
  { value: 'CE', label: 'C.E. (Cédula de Extranjería)' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'T.I. (Tarjeta de Identidad)' },
];

export const COUNTRY_CODE_OPTIONS = [
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+52', label: '🇲🇽 +52' },
];

export const RELATIVE_OPTIONS = ['Madre', 'Padre', 'Hermano/a', 'Pareja', 'Amigo/a', 'Otro'];
export const DISCOVERY_OPTIONS = ['Instagram', 'Tiktok', 'Google', 'Recomendacion', 'Otro'];
export const GOALS_OPTIONS = [
  'Tonificar/Moldear el cuerpo',
  'Reducir estres',
  'Desafío personal/Romper rutina',
  'Pertenecer a una comunidad',
];
export const DISCIPLINES_OPTIONS = ['Pole Dance', 'Flexibilidad', 'Telas', 'Aro', 'Baile/Coreografía'];
export const LEVEL_OPTIONS = ['Nunca he hecho ejercicio', 'Principiante', 'Intermedio', 'Avanzado'];
export const SCHEDULE_OPTIONS = [
  'Lunes a Viernes 6am - 10am',
  'Lunes a Viernes 10am - 4pm',
  'Lunes a Viernes 4pm - 9pm',
  'Sábados',
  'Domingos',
  'Festivos',
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
  figureById: (id: number) => `/figure/${id}`,
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
