import { PermissionDetailsResponse } from "./Permission";

export interface CreateRoleRequest {
  name: string;
  order?: number;
  permissions?: string[];
}

export interface UpdateRoleRequest extends CreateRoleRequest { }

export interface RoleDetailsResponse {
  _id: string;
  name: string;
  order?: number;
  permissions?: PermissionDetailsResponse[] | string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleListResponse {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  results: Partial<RoleDetailsResponse>[];
}
