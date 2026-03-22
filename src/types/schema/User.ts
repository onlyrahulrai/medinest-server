import mongoose from "mongoose";

export interface CaregiverContactResponse {
  userId?: string | mongoose.Types.ObjectId;
  name?: string;
  phoneNumber?: string;
  relation?: string;
  verificationStatus?: "verified_user" | "unregistered_contact" | "verification_pending";
  inviteStatus?: "not_required" | "pending_invite" | "invite_sent" | "accepted" | "expired" | "rejected";
}

export interface CreatUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest extends CreatUserRequest { }

export interface UserDetailsResponse {
  _id?: string | mongoose.Types.ObjectId; // MongoDB ObjectId as string
  name: string;
  email: string;
  phone?: string;
  profile?: any;
  dateOfBirth?: Date;
  weight?: number;
  gender?: "Male" | "Female" | "Other";
  conditions?: string[];
  isOnboardingCompleted?: boolean;
  languages?: string[];
  preferences?: {
    reminderTimes?: string[];
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    shareActivityWithCaregiver?: boolean;
  };
  caregiverContacts?: CaregiverContactResponse[];
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  roles?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  results: UserDetailsResponse[];
}

export interface AuthUserResponse extends UserDetailsResponse {
  access: string;
  refresh: string;
}