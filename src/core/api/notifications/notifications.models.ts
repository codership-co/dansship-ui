export interface NotificationConfig {
  type: string;
  is_enabled: boolean;
  enabled?: boolean;
  lead_time_minutes?: number;
  description: string;
}

export interface UpdateNotificationConfigPayload {
  is_enabled?: boolean;
  enabled?: boolean;
  lead_time_minutes?: number;
}
