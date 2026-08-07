export type RentalRequestStatus = 'draft' | 'pending_payment' | 'pending_approval' | 'confirmed' | 'cancelled';

export type RentalRequestType = 'studio_rental' | 'internal_reserved_use';
export type RentalPurpose = 'self_practice' | 'private_class' | 'workshop' | 'internal_reserved_use';
export type RentalRoleType = 'internal_instructor' | 'external_user';

export type CalendarBlockKind = 'free' | 'occupied';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type RoomResourceType = 'pole' | 'lyra' | 'aerial_fabric' | 'pendular_pole';

export interface RentalSlot {
  id: string;
  room_id: string;
  resource_id?: string | null;
  start_time: string;
  end_time: string;
  price: string;
}

export interface GetCalendarParams {
  start_at: string;
  end_at: string;
}

/** @deprecated Prefer GetCalendarParams + getRoomCalendar */
export interface GetAvailabilityParams {
  room_id: string;
  start_at: string;
  end_at: string;
}

export interface CalendarBlock {
  start_time: string;
  end_time: string;
  kind: CalendarBlockKind;
}

export interface RentalRequest {
  id: string;
  user_id: string;
  rental_series_id?: string | null;
  type: RentalRequestType;
  purpose: RentalPurpose;
  role_type: RentalRoleType;
  status: RentalRequestStatus;
  total_price: string;
  currency: string;
  terms_accepted?: boolean;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  slots: Array<RentalSlot>;
}

export interface RentalSlotCreate {
  room_id: string;
  resource_id?: string | null;
  start_time: string;
  end_time: string;
}

export interface CreateRentalRequestPayload {
  type?: RentalRequestType;
  purpose?: RentalPurpose;
  terms_accepted: true;
  slots: Array<RentalSlotCreate>;
}

export interface CreateRentalSeriesPayload {
  room_id: string;
  resource_id?: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  series_start_date: string;
  series_end_date?: string | null;
  occurrence_count?: number | null;
  terms_accepted: true;
}

export interface RentalSeries {
  id: string;
  user_id: string;
  room_id: string;
  resource_id?: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  series_start_date: string;
  series_end_date?: string | null;
  occurrence_count?: number | null;
  role_type: RentalRoleType;
  status: RentalRequestStatus;
  total_price: string;
  currency: string;
  tax_type_id: string;
  benefit_definition_id?: string | null;
  benefit_code_snapshot?: string | null;
  discount_amount?: string | null;
  terms_accepted: boolean;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  requests: Array<RentalRequest>;
}

export interface AdminListRequestsPayload {
  status?: RentalRequestStatus;
}

export interface AdminListSeriesPayload {
  status?: RentalRequestStatus;
}

export interface ListAvailabilityBlocksParams {
  room_id: string;
}

export interface InternalReservedUseCreatePayload {
  slots: Array<RentalSlotCreate>;
}

export interface AdminListInternalReservedUsesParams {
  status?: RentalRequestStatus;
}

export interface RoomResourceOption {
  id: string;
  resource_type: RoomResourceType;
  label?: string | null;
  position: number;
  hourly_rental_price: string;
  tax_type_id: string;
  is_active: boolean;
}

export interface CreateRoomResourcePayload {
  resource_type: RoomResourceType;
  label?: string | null;
  hourly_rental_price: string;
  tax_type_id: string;
  is_active?: boolean;
  position?: number | null;
}

export interface UpdateRoomResourcePayload {
  resource_type?: RoomResourceType;
  label?: string | null;
  hourly_rental_price?: string;
  tax_type_id?: string;
  is_active?: boolean;
  position?: number | null;
}

export interface StudioRentalRoomOption {
  id: string;
  name: string;
  capacity: number;
  room_type?: string | null;
  description?: string | null;
  hourly_rental_price?: string | null;
  tax_type_id?: string | null;
  resources: Array<RoomResourceOption>;
}

/** @deprecated Prefer CalendarBlock via getRoomCalendar */
export interface StudioRentalAvailabilitySlot {
  room_id: string;
  start_time: string;
  end_time: string;
  base_price?: string | null;
}

export interface RoomAvailabilityBlock {
  id: string;
  room_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active: boolean;
  notes?: string | null;
}

export interface RoomAvailabilityBlockCreatePayload {
  room_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  notes?: string | null;
}

export interface RoomAvailabilityBlockUpdatePayload {
  day_of_week?: DayOfWeek | null;
  start_time?: string | null;
  end_time?: string | null;
  is_active?: boolean | null;
  notes?: string | null;
}

export interface CancelRequestPayload {
  reason?: string;
}

export interface AdminRejectPayload {
  reason?: string;
}

export interface AdminCancelInternalReservedUsePayload {
  reason?: string;
}
