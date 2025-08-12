import { Types } from "mongoose";
import { PermissionResponse } from "./Permission";

export interface RoleRequest {
  name?: string;
  order?: number;
  permissions?:  Types.ObjectId[];
}

export interface RoleResponse {
  id: string;
  name: string;
  order?: number;
  permissions?: PermissionResponse[] | string[];
  createdAt: string; // often dates come as ISO strings from APIs
  updatedAt: string;
}
