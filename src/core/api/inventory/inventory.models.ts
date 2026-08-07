export interface GetRoomsParams {
  is_active?: boolean;
}

export interface GetClassesParams {
  is_active?: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  room_type?: string;
  description?: string;
  image_key?: string | null;
  image_url?: string | null;
  is_active: boolean;
  hourly_rental_price?: string;
  tax_type_id?: string;
  created_at: string;
  updated_at?: string;
}

export type CreateRoomPayload = Omit<
  Room,
  'id' | 'is_active' | 'created_at' | 'updated_at' | 'image_key' | 'image_url'
> & {
  hourly_rental_price?: string | null;
  tax_type_id?: string | null;
};
export type UpdateRoomPayload = Partial<CreateRoomPayload>;

export interface RoomImageUploadRequest {
  content_type: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface RoomImageUploadResponse {
  upload_url: string;
  file_key: string;
}

export interface RoomImageConfirmRequest {
  file_key: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassDefinition {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  max_participants: number;
  default_room_type?: string;
  level?: string;
  class_group_id: string;
  is_active: boolean;
  created_at: string;
}

export type CreateClassDefinitionPayload = Omit<ClassDefinition, 'id' | 'is_active' | 'created_at'>;
export type UpdateClassDefinitionPayload = Partial<CreateClassDefinitionPayload>;
