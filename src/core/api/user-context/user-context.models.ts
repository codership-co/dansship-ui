export type CommunicationPlatform = 'whatsapp' | 'instagram';

export interface UserNote {
  id: string;
  user_id: string;
  body: string;
  created_by_id: string | null;
  created_by_full_name: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface UserNotesResponse {
  notes: Array<UserNote>;
}

export interface CreateUserNotePayload {
  body: string;
}

export interface UserChannel {
  id: string;
  user_id: string;
  platform: CommunicationPlatform;
  identifier: string;
  is_favorite: boolean;
  created_by_id: string | null;
  created_by_full_name: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserChannelsResponse {
  channels: Array<UserChannel>;
}

export interface CreateUserChannelPayload {
  platform: CommunicationPlatform;
  identifier: string;
  is_favorite?: boolean;
}
