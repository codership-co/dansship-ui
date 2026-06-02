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
  is_active: boolean;
  created_at: string;
}

export type CreateRoomPayload = Omit<Room, 'id' | 'is_active' | 'created_at'>;
export type UpdateRoomPayload = Partial<CreateRoomPayload>;

export interface ClassDefinition {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  max_participants: number;
  default_room_type?: string;
  level?: string;
  is_active: boolean;
  created_at: string;
}

export type CreateClassDefinitionPayload = Omit<ClassDefinition, 'id' | 'is_active' | 'created_at'>;
export type UpdateClassDefinitionPayload = Partial<CreateClassDefinitionPayload>;
