export interface CreatePermissionRequest {
  name: string;
}

export interface UpdatePermissionRequest extends CreatePermissionRequest {}

export interface PermissionDetailsResponse {
  _id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionListResponse {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  results: Partial<PermissionDetailsResponse>[];
}