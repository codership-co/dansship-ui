export enum ROLE {
  ADMIN = 'admin',
  AREA_LEADER = 'area_leader',
  INSTRUCTOR = 'instructor',
  USER = 'user',
  COACH = 'coach',
}

export enum PERMISSION {
  // USERS
  USER_READ = 'read:user',
  USER_MANAGE = 'manage:user',
  USER_CONTEXT_MANAGE = 'manage:user_context',

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
  CLASS_CATALOG_READ = 'read:class_catalog',

  // CLASS GROUP
  CLASS_GROUP_MANAGE = 'manage:class_group',

  // DISCOUNT
  DISCOUNT_MANAGE = 'manage:discount',

  // FIGURE
  FIGURE_MANAGE = 'manage:figure',

  // INSTRUCTOR
  INSTRUCTOR_LIST = 'list:instructor',

  // INSTRUCTOR PAYMENT DOCUMENTS
  OWN_PAYMENT_DOCUMENT_MANAGE = 'manage:own_payment_document',
  INSTRUCTOR_PAYMENT_DOCUMENT_READ = 'read:instructor_payment_document',
  INSTRUCTOR_PAYMENT_DOCUMENT_VOID = 'void:instructor_payment_document',
  INSTRUCTOR_PAY_RATE_MANAGE = 'manage:instructor_pay_rate',

  // ORDER
  ORDER_CREATE = 'create:order',

  // PAYMENT
  PAYMENT_MANAGE = 'manage:payment',

  // WALLET
  WALLET_MANAGE = 'manage:wallet',

  // DOOR CODE
  DOOR_CODE_MANAGE = 'manage:door_code',

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

  // STUDENT REPORT
  STUDENT_REPORT_READ = 'read:student_report',

  // INSTRUCTOR REPORT
  INSTRUCTOR_REPORT_READ = 'read:instructor_report',

  // STUDIO RENTAL REPORT
  STUDIO_RENTAL_REPORT_READ = 'read:studio_rental_report',

  // ROLE
  ROLE_MANAGE = 'manage:role',

  // ROOM
  ROOM_MANAGE = 'manage:room',
  ROOM_READ = 'read:room',

  // ROSTER
  ROSTER_ADD = 'add:roster',
  ROSTER_READ = 'read:roster',

  // STUDENT PROFILE
  STUDENT_PROFILE_READ = 'read:student_profile',

  // SCHEDULE
  SCHEDULE_MANAGE = 'manage:schedule',
  SCHEDULE_DRAFT_CREATE = 'create:schedule_draft',
  SCHEDULED_CLASS_CANCEL = 'cancel:scheduled_class',

  // STUDIO RENTAL
  STUDIO_RENTAL_CREATE = 'create:studio_rental',
  STUDIO_RENTAL_MANAGE = 'manage:studio_rental',
  STUDIO_RENTAL_READ = 'read:studio_rental',

  // SUBSCRIPTION
  SUBSCRIPTION_MANAGE = 'manage:subscription',
  SUBSCRIPTION_PURCHASE = 'purchase:subscription',
  SUBSCRIPTION_READ = 'read:subscription',

  // BENEFIT
  BENEFIT_READ = 'read:benefit',

  // CAMPAIGN
  CAMPAIGN_MANAGE = 'manage:campaign',

  // NOTIFICATION
  NOTIFICATION_MANAGE = 'manage:notification',
}

export const InstructorPermissions = {
  dashboard: [
    PERMISSION.ROSTER_READ,
    PERMISSION.AVAILABILITY_SUBMIT,
    PERMISSION.AVAILABILITY_READ,
    PERMISSION.ATTENDANCE_MARK,
    PERMISSION.ROSTER_ADD,
  ],
  studentProfile: [PERMISSION.STUDENT_PROFILE_READ],
};

export const StudentPermissions = {
  training: [PERMISSION.PROGRESS_MANAGE],
  bookings: [PERMISSION.BOOKING_READ, PERMISSION.BOOKING_CREATE, PERMISSION.BOOKING_CANCEL],
  subscription: [PERMISSION.SUBSCRIPTION_READ, PERMISSION.SUBSCRIPTION_PURCHASE],
  studioRental: [PERMISSION.STUDIO_RENTAL_READ, PERMISSION.STUDIO_RENTAL_CREATE],
};

export const AdminPermissions = {
  users: [PERMISSION.USER_MANAGE],
  userContext: [PERMISSION.USER_CONTEXT_MANAGE],
  roles: [PERMISSION.ROLE_MANAGE],
  scheduleBuilder: [PERMISSION.SCHEDULE_MANAGE, PERMISSION.SCHEDULE_DRAFT_CREATE],
  scheduleManage: [PERMISSION.SCHEDULE_MANAGE],
  inventory: [
    PERMISSION.ROOM_MANAGE,
    PERMISSION.CLASS_CATALOG_MANAGE,
    PERMISSION.CLASS_GROUP_MANAGE,
    PERMISSION.PLAN_MANAGE,
  ],
  bookings: [PERMISSION.BOOKING_MANAGE],
  payments: [PERMISSION.PAYMENT_MANAGE],
  wallet: [PERMISSION.WALLET_MANAGE],
  doorCode: [PERMISSION.DOOR_CODE_MANAGE],
  subscriptions: [PERMISSION.SUBSCRIPTION_MANAGE],
  benefits: [PERMISSION.BENEFIT_READ],
  merch: [PERMISSION.PRODUCT_MANAGE],
  merchPos: [PERMISSION.ORDER_CREATE],
  figures: [PERMISSION.FIGURE_MANAGE],
  reports: [PERMISSION.REPORT_READ],
  studentReports: [PERMISSION.STUDENT_REPORT_READ],
  instructorReports: [PERMISSION.INSTRUCTOR_REPORT_READ],
  studioRentalReports: [PERMISSION.STUDIO_RENTAL_REPORT_READ],
  financialReports: [PERMISSION.FINANCIAL_REPORT_READ],
  notifications: [PERMISSION.NOTIFICATION_MANAGE],
  studioRental: [PERMISSION.STUDIO_RENTAL_MANAGE],
  campaigns: [PERMISSION.CAMPAIGN_MANAGE],
};
