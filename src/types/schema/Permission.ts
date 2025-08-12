export interface PermissionRequest {
  name: string;
}

export interface PermissionResponse {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}
