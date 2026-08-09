import { addBreadcrumb, withScope, captureException } from '@sentry/react';
import { HttpClientError, LoggerParams, RequestState } from 'polpo-http-client';

export enum DANSSHIP_ERROR_CATEGORY {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

/* eslint-disable */
export enum DANSSHIP_ERROR_CODE {
  // HTTP & General Error Codes
  BAD_REQUEST = 'BAD_REQUEST', // BUSINESS_RULE_VIOLATION = Generic bad request (malformed payload, invalid parameters) |
  BAD_REQUEST_GENERIC = 'BAD_REQUEST_GENERIC', // BUSINESS_RULE_VIOLATION = Generic bad request placeholder |
  UNAUTHORIZED = 'UNAUTHORIZED', // AUTHENTICATION_ERROR = No valid authentication credentials provided |
  FORBIDDEN = 'FORBIDDEN', // AUTHORIZATION_ERROR = Authenticated user lacks required permissions |
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND', // RESOURCE_NOT_FOUND = Generic not-found error |
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED', // BUSINESS_RULE_VIOLATION = HTTP method not allowed on resource |
  CONFLICT = 'CONFLICT', // CONFLICT = Generic conflict (e.g., duplicate, state violation) |
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS', // BUSINESS_RULE_VIOLATION = Rate limit exceeded |
  VALIDATION_FAILED = 'VALIDATION_FAILED', // VALIDATION_ERROR = Request validation failed (see `details.errors` for field-level errors) |
  CLIENT_ERROR = 'CLIENT_ERROR', // BUSINESS_RULE_VIOLATION = Catch-all for unspecified 4xx errors |
  SERVER_ERROR = 'SERVER_ERROR', // SYSTEM_ERROR = Catch-all for unspecified 5xx errors |
  HTTP_ERROR = 'HTTP_ERROR', // SYSTEM_ERROR = Catch-all for unspecified HTTP errors |
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', // SYSTEM_ERROR = Unexpected server error |

  // Authentication & Authorization
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING', // AUTHENTICATION_ERROR = No Bearer token in Authorization header |
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID', // AUTHENTICATION_ERROR = Bearer token is invalid or malformed |
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED', // AUTHENTICATION_ERROR = Bearer token has expired |
  AUTH_TOKEN_PAYLOAD_INVALID = 'AUTH_TOKEN_PAYLOAD_INVALID', // AUTHENTICATION_ERROR = Token payload is invalid or missing required claims |
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND', // AUTHENTICATION_ERROR = User referenced in token does not exist |
  AUTH_USER_INACTIVE = 'AUTH_USER_INACTIVE', // AUTHENTICATION_ERROR = User account is inactive or deactivated |
  PERMISSION_DENIED = 'PERMISSION_DENIED', // AUTHORIZATION_ERROR = User lacks required permission for the action/resource |

  // Onboarding & Onboarding Flows
  ONBOARDING_REQUIRED = 'ONBOARDING_REQUIRED', // AUTHORIZATION_ERROR = User has not completed required onboarding steps |
  ONBOARDING_STEP_INVALID = 'ONBOARDING_STEP_INVALID', // VALIDATION_ERROR = Onboarding step payload is invalid |
  ONBOARDING_UPLOAD_PURPOSE_NOT_ALLOWED = 'ONBOARDING_UPLOAD_PURPOSE_NOT_ALLOWED', // VALIDATION_ERROR = Upload purpose not allowed for this user |

  // Schedules & Agenda
  SCHEDULE_RESOURCE_NOT_FOUND = 'SCHEDULE_RESOURCE_NOT_FOUND', // RESOURCE_NOT_FOUND = Schedule week or scheduled class not found |
  SCHEDULE_OVERLAP_CONFLICT = 'SCHEDULE_OVERLAP_CONFLICT', // CONFLICT = Generic schedule overlap (see `details.conflict_type` for specifics) |
  SCHEDULE_INSTRUCTOR_OVERLAP_CONFLICT = 'SCHEDULE_INSTRUCTOR_OVERLAP_CONFLICT', // CONFLICT = Instructor has another class during the same time slot |
  SCHEDULE_ROOM_OVERLAP_CONFLICT = 'SCHEDULE_ROOM_OVERLAP_CONFLICT', // CONFLICT = Room is booked for another class during the same time slot |
  INVALID_SCHEDULE_STATE = 'INVALID_SCHEDULE_STATE', // BUSINESS_RULE_VIOLATION = Schedule state transition is invalid (e.g., can only edit unpublished schedules) |
  AGENDA_INVALID_RANGE = 'AGENDA_INVALID_RANGE', // VALIDATION_ERROR = Invalid date range for agenda query (e.g., start_date > end_date) |
  AGENDA_ROOM_OCCUPANCY_CONFLICT = 'AGENDA_ROOM_OCCUPANCY_CONFLICT', // CONFLICT = Room occupancy rule violation (cross-domain scheduling conflict) |

  // Bookings
  CLASS_FULL = 'CLASS_FULL',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND', // RESOURCE_NOT_FOUND = Booking does not exist |
  SCHEDULED_CLASS_NOT_FOUND = 'SCHEDULED_CLASS_NOT_FOUND', // RESOURCE_NOT_FOUND = Scheduled class is not available for booking |
  BOOKING_CLASS_FULL = 'BOOKING_CLASS_FULL', // CONFLICT = Class is at full capacity |
  BOOKING_TIME_OVERLAP = 'BOOKING_TIME_OVERLAP', // CONFLICT = Student already has a booking during the proposed time slot |
  BOOKING_SUBSCRIPTION_NOT_ELIGIBLE = 'BOOKING_SUBSCRIPTION_NOT_ELIGIBLE', // VALIDATION_ERROR = Student's subscription plan does not support this class or resource |
  BOOKING_SUBSCRIPTION_NOT_STARTED = 'BOOKING_SUBSCRIPTION_NOT_STARTED', // VALIDATION_ERROR = Class is before the plan start date |
  BOOKING_CLASS_GROUP_NOT_COVERED = 'BOOKING_CLASS_GROUP_NOT_COVERED', // VALIDATION_ERROR = Active subscription does not cover this class group |
  BOOKING_POLICY_NOT_FOUND = 'BOOKING_POLICY_NOT_FOUND', // RESOURCE_NOT_FOUND = Booking policy configuration does not exist |
  BOOKING_LATE_JOIN_CLOSED = 'BOOKING_LATE_JOIN_CLOSED', // VALIDATION_ERROR = Class late-join window has closed |

  // Payments & Payment Intents
  PAYMENT_INTENT_NOT_FOUND = 'PAYMENT_INTENT_NOT_FOUND', // RESOURCE_NOT_FOUND = Payment intent does not exist |
  PAYMENT_INTENT_INVALID_REQUEST = 'PAYMENT_INTENT_INVALID_REQUEST', // VALIDATION_ERROR = Payment intent request payload is invalid |
  PAYMENT_INTENT_NOT_REVIEWABLE = 'PAYMENT_INTENT_NOT_REVIEWABLE', // CONFLICT = Payment intent is not in a reviewable state |
  PAYMENT_INTENT_NOT_CANCELLABLE = 'PAYMENT_INTENT_NOT_CANCELLABLE', // CONFLICT = Payment intent cannot be cancelled in its current state |
  PAYMENT_INTENT_EXPIRED = 'PAYMENT_INTENT_EXPIRED', // CONFLICT = Payment intent has expired |
  PAYMENT_INTENT_UNAUTHORIZED = 'PAYMENT_INTENT_UNAUTHORIZED', // AUTHORIZATION_ERROR = User is not authorized to review/approve this payment intent |
  PAYMENT_METHOD_NOT_AVAILABLE = 'PAYMENT_METHOD_NOT_AVAILABLE', // VALIDATION_ERROR = Selected payment method is not available or configured |
  PAYMENT_PROOF_NOT_AVAILABLE = 'PAYMENT_PROOF_NOT_AVAILABLE', // RESOURCE_NOT_FOUND = Payment proof file does not exist |
  PAYMENT_PROOF_UPLOAD_FAILED = 'PAYMENT_PROOF_UPLOAD_FAILED', // SYSTEM_ERROR = File upload to storage service failed |

  // Studio Rentals
  STUDIO_RENTAL_REQUEST_NOT_FOUND = 'STUDIO_RENTAL_REQUEST_NOT_FOUND', // RESOURCE_NOT_FOUND = Studio rental request does not exist |
  STUDIO_RENTAL_INVALID_REQUEST = 'STUDIO_RENTAL_INVALID_REQUEST', // VALIDATION_ERROR = Studio rental request payload is invalid |
  STUDIO_RENTAL_LEAD_TIME_REQUIRED = 'STUDIO_RENTAL_LEAD_TIME_REQUIRED', // VALIDATION_ERROR = External rentals require at least 24h lead time |
  STUDIO_RENTAL_INVALID_AVAILABILITY_RANGE = 'STUDIO_RENTAL_INVALID_AVAILABILITY_RANGE', // VALIDATION_ERROR = Invalid date/time range for availability check |
  STUDIO_RENTAL_SLOT_CONFLICT = 'STUDIO_RENTAL_SLOT_CONFLICT', // CONFLICT = Selected time slot conflicts with another rental or blocked time |
  STUDIO_RENTAL_PAYMENT_CONFLICT = 'STUDIO_RENTAL_PAYMENT_CONFLICT', // CONFLICT = Payment issue prevents rental confirmation |
  STUDIO_RENTAL_INVALID_STATE_TRANSITION = 'STUDIO_RENTAL_INVALID_STATE_TRANSITION', // CONFLICT = Rental state transition is invalid (e.g., cannot approve a cancelled rental) |
  STUDIO_RENTAL_INVALID_RULE = 'STUDIO_RENTAL_INVALID_RULE', // VALIDATION_ERROR = Rental rule payload is invalid |
  STUDIO_RENTAL_RULE_NOT_FOUND = 'STUDIO_RENTAL_RULE_NOT_FOUND', // RESOURCE_NOT_FOUND = Rental rule does not exist |
  INTERNAL_RESERVED_USE_INVALID_REQUEST = 'INTERNAL_RESERVED_USE_INVALID_REQUEST', // VALIDATION_ERROR = Internal reserved-use booking request is invalid |
  INTERNAL_RESERVED_USE_NOT_FOUND = 'INTERNAL_RESERVED_USE_NOT_FOUND', // RESOURCE_NOT_FOUND = Internal reserved-use booking does not exist |

  // Products & Inventory (Merch Store)
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND', // RESOURCE_NOT_FOUND = Product does not exist |
  DUPLICATE_SKU = 'DUPLICATE_SKU', // CONFLICT = Product SKU already exists in catalog |
  MERCH_IMAGE_UPLOAD_NOT_CONFIGURED = 'MERCH_IMAGE_UPLOAD_NOT_CONFIGURED', // SYSTEM_ERROR = Image upload service is not configured |
  MERCH_IMAGE_UPLOAD_FAILED = 'MERCH_IMAGE_UPLOAD_FAILED', // SYSTEM_ERROR = Product image upload failed |
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND', // RESOURCE_NOT_FOUND = Merch order does not exist |
  INVALID_ORDER_ITEMS = 'INVALID_ORDER_ITEMS', // VALIDATION_ERROR = Order items list is empty or invalid |
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK', // CONFLICT = Product stock is insufficient to fulfill order |
  STOCK_DEPLETED_SINCE_ORDER = 'STOCK_DEPLETED_SINCE_ORDER', // CONFLICT = Product stock was depleted after order was placed but before payment confirmed |
  INVALID_ORDER_STATUS_TRANSITION = 'INVALID_ORDER_STATUS_TRANSITION', // CONFLICT = Order status transition is invalid (e.g., cannot cancel a completed order) |

  // Figures (Skills/Moves)
  FIGURE_IMAGE_UPLOAD_NOT_CONFIGURED = 'FIGURE_IMAGE_UPLOAD_NOT_CONFIGURED', // SYSTEM_ERROR = Figure image upload service is not configured |
  FIGURE_IMAGE_UPLOAD_FAILED = 'FIGURE_IMAGE_UPLOAD_FAILED', // SYSTEM_ERROR = Figure image upload failed |

  // Payment Gateway Integration
  UNSUPPORTED_PURCHASE_TYPE = 'UNSUPPORTED_PURCHASE_TYPE', // VALIDATION_ERROR = Payment gateway does not support the requested purchase type |
}
/* eslint-enable */

export interface DansshipResponseError {
  category: DANSSHIP_ERROR_CATEGORY;
  error_code: DANSSHIP_ERROR_CODE;
  message: string;
  status: number;
  timestamp: string;
  path: string;
  details: {
    next_action: string;
    resend_verification_endpoint: string;
  };
  request_id: string | null;
  trace_id: string | null;
}

export class DansshipAPIError extends HttpClientError<DansshipResponseError> {
  constructor(
    readonly body: DansshipResponseError,
    readonly status: number,
    readonly message: string = 'Unexpected error occurred',
    readonly error?: unknown,
  ) {
    super(body, status, `[DansshipAPIError]: ${message}`, error);

    if (error instanceof Error) {
      this.stack = error.stack ?? '';
    }
  }
}

export async function getResponseError(response: Response, message: string) {
  const body = (await response.json()) as DansshipResponseError;

  return new DansshipAPIError(body, response.status, body.message ?? message);
}

const SKIP_API_ERROR_CODES = new Set<DANSSHIP_ERROR_CODE>([
  DANSSHIP_ERROR_CODE.UNAUTHORIZED,
  DANSSHIP_ERROR_CODE.EMAIL_NOT_VERIFIED,
  DANSSHIP_ERROR_CODE.TOO_MANY_REQUESTS,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_EXPIRED,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_INVALID,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_MISSING,
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL,
  DANSSHIP_ERROR_CODE.CLASS_FULL,
  DANSSHIP_ERROR_CODE.BOOKING_TIME_OVERLAP,
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_GROUP_NOT_COVERED,
  DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_ELIGIBLE,
  DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_STARTED,
  DANSSHIP_ERROR_CODE.BOOKING_LATE_JOIN_CLOSED,
  DANSSHIP_ERROR_CODE.VALIDATION_FAILED,
  DANSSHIP_ERROR_CODE.FORBIDDEN,
  DANSSHIP_ERROR_CODE.PERMISSION_DENIED,
  DANSSHIP_ERROR_CODE.ONBOARDING_REQUIRED,
  DANSSHIP_ERROR_CODE.ONBOARDING_STEP_INVALID,
  DANSSHIP_ERROR_CODE.SCHEDULE_ROOM_OVERLAP_CONFLICT,
  DANSSHIP_ERROR_CODE.SCHEDULE_INSTRUCTOR_OVERLAP_CONFLICT,
  DANSSHIP_ERROR_CODE.SCHEDULE_OVERLAP_CONFLICT,
  DANSSHIP_ERROR_CODE.SCHEDULE_RESOURCE_NOT_FOUND,
  DANSSHIP_ERROR_CODE.STUDIO_RENTAL_LEAD_TIME_REQUIRED,
  DANSSHIP_ERROR_CODE.STUDIO_RENTAL_INVALID_REQUEST,
  DANSSHIP_ERROR_CODE.STUDIO_RENTAL_SLOT_CONFLICT,
]);

export async function logger({ state, response }: LoggerParams) {
  if (state !== RequestState.REJECTED) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(response);

  const rejected = response as { status?: number; error?: unknown } | null;
  const error = rejected?.error;
  const status = rejected?.status ?? (error instanceof DansshipAPIError ? error.status : undefined);

  if (error instanceof DansshipAPIError && SKIP_API_ERROR_CODES.has(error.body.error_code)) {
    addBreadcrumb({
      category: 'api.expected_error',
      message: error.body.error_code,
      level: 'info',
      data: { status, path: error.body.path },
    });

    return;
  }

  withScope(scope => {
    if (status !== undefined) {
      scope.setTag('http.status_code', String(status));
    }

    if (error instanceof DansshipAPIError) {
      scope.setTag('error_code', error.body.error_code);

      if (error.body.request_id) {
        scope.setTag('request_id', error.body.request_id);
      }

      if (error.body.trace_id) {
        scope.setTag('trace_id', error.body.trace_id);
      }

      captureException(error);

      return;
    }

    captureException(error instanceof Error ? error : new Error('API request rejected'));
  });
}
