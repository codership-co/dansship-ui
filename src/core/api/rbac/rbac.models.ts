export interface PolicyResponse {
  id: string;
  name: string;
  action: string;
  resource: string;
  description: string | null;
  created_at: string;
}

export interface PolicyBriefResponse {
  id: string;
  name: string;
  action: string;
  resource: string;
}

export interface PolicyCreatePayload {
  name: string;
  action: string;
  resource: string;
  description?: string | null;
}

export interface PolicyUpdatePayload {
  name?: string | null;
  action?: string | null;
  resource?: string | null;
  description?: string | null;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface RoleDetailResponse {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  policies: Array<PolicyBriefResponse>;
}

export interface AssignPolicyToRolePayload {
  policy_id: string;
}

export interface AssignRoleToUserPayload {
  role_id: string;
  instructor_profile?: {
    bio?: string;
    photo_url?: string;
    contact_info?: string;
  };
}

export interface UserWithRolesResponse {
  id: string;
  email: string;
  roles: Array<RoleResponse>;
}
