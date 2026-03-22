import { ErrorMessageResponse } from "./Common";
import { UserDetailsResponse } from "./User";
import mongoose from "mongoose";

export interface VerifyPhoneInput {
  phone?: string;
  otp?: string;
}

export interface ResendPhoneOtpInput {
  phone?: string;
}

export interface OnboardingCaregiverInput {
  name?: string;
  phoneNumber?: string;
  relation?: string;
}

export interface OnboardingPreferencesInput {
  reminderTimes?: string[];
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  shareActivityWithCaregiver?: boolean;
}

export interface SaveOnboardingProfileInput {
  name?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  weight?: string;
  conditions?: string[];
  languages?: string[];
  caregivers?: OnboardingCaregiverInput[];
  preferences?: OnboardingPreferencesInput;
  isOnboardingCompleted?: boolean;
  onboardingStep?: number;
}

export interface CaregiverLookupResponse {
  found: boolean;
  userId?: string | mongoose.Types.ObjectId;
  name?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
}

export interface EditProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  profile?: any;
  bio?: string;
  address?: string;
}

export interface AuthUserResponse extends UserDetailsResponse {
  access: string;
  refresh: string;
}

export interface AuthenticationRequiredResponse extends ErrorMessageResponse {
}
