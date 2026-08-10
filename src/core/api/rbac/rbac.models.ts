export interface RbacRole {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserWithRolesResponse {
  id: string;
  email: string;
  roles: Array<RbacRole>;
}
