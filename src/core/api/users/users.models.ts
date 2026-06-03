export interface UsersSearchParams {
  email: string;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: string;
  roles: Array<string>;
  permissions: Array<string>;
}
