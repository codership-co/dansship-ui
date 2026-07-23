export enum ROLE {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  USER = 'user',
  COACH = 'coach',
}

export enum PERMISSION {
  // USERS
  USER_READ = 'read:user',
  USER_MANAGE = 'manage:user',

  // ATTENDANCE
  ATTENDANCE_MARK = 'mark:attendance',

  // AVAILABILITY
  AVAILABILITY_READ = 'read:availability',
  AVAILABILITY_SUBMIT = 'submit:availability',

  // BOOKING
  BOOKING_CANCEL = 'cancel:booking',
  BOOKING_CREATE = 'create:booking',
  BOOKING_MANAGE = 'manage:booking',
  BOOKING_READ = 'read:booking',

  // CLASS CATALOG
  CLASS_CATALOG_MANAGE = 'manage:class_catalog',

  // CLASS GROUP
  CLASS_GROUP_MANAGE = 'manage:class_group',

  // DISCOUNT
  DISCOUNT_MANAGE = 'manage:discount',

  // FIGURE
  FIGURE_MANAGE = 'manage:figure',

  // ORDER
  ORDER_CREATE = 'create:order',

  // PAYMENT
  PAYMENT_MANAGE = 'manage:payment',

  // PLAN
  PLAN_MANAGE = 'manage:plan',

  // PRODUCT
  PRODUCT_MANAGE = 'manage:product',

  // PROGRESS
  PROGRESS_MANAGE = 'manage:progress',

  // REPORT
  REPORT_READ = 'read:report',

  // FINANCIAL REPORT
  FINANCIAL_REPORT_READ = 'read:financial_report',

  // ROOM
  ROOM_MANAGE = 'manage:room',

  // ROSTER
  ROSTER_ADD = 'add:roster',
  ROSTER_READ = 'read:roster',

  // SCHEDULE
  SCHEDULE_MANAGE = 'manage:schedule',

  // STUDIO RENTAL
  STUDIO_RENTAL_CREATE = 'create:studio_rental',
  STUDIO_RENTAL_MANAGE = 'manage:studio_rental',
  STUDIO_RENTAL_READ = 'read:studio_rental',

  // SUBSCRIPTION
  SUBSCRIPTION_PURCHASE = 'purchase:subscription',
  SUBSCRIPTION_READ = 'read:subscription',
}

export const InstructorPermissions = {
  dashboard: [
    PERMISSION.ROSTER_READ,
    PERMISSION.AVAILABILITY_SUBMIT,
    PERMISSION.AVAILABILITY_READ,
    PERMISSION.ATTENDANCE_MARK,
    PERMISSION.ROSTER_ADD,
  ],
};

export const StudentPermissions = {
  training: [PERMISSION.PROGRESS_MANAGE],
  bookings: [PERMISSION.BOOKING_READ, PERMISSION.BOOKING_CREATE, PERMISSION.BOOKING_CANCEL],
  subscription: [PERMISSION.SUBSCRIPTION_READ, PERMISSION.SUBSCRIPTION_PURCHASE],
  studioRental: [PERMISSION.STUDIO_RENTAL_READ, PERMISSION.STUDIO_RENTAL_CREATE],
};

export const AdminPermissions = {
  users: [PERMISSION.USER_MANAGE, PERMISSION.USER_READ],
  scheduleBuilder: [PERMISSION.SCHEDULE_MANAGE],
  inventory: [
    PERMISSION.ROOM_MANAGE,
    PERMISSION.CLASS_CATALOG_MANAGE,
    PERMISSION.CLASS_GROUP_MANAGE,
    PERMISSION.PLAN_MANAGE,
    PERMISSION.DISCOUNT_MANAGE,
  ],
  bookings: [PERMISSION.BOOKING_MANAGE],
  payments: [PERMISSION.PAYMENT_MANAGE],
  merch: [PERMISSION.PRODUCT_MANAGE],
  merchPos: [PERMISSION.ORDER_CREATE],
  figures: [PERMISSION.FIGURE_MANAGE],
  reports: [PERMISSION.REPORT_READ],
  studioRental: [PERMISSION.STUDIO_RENTAL_MANAGE],
};
