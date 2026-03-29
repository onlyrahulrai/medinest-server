import { ErrorMessageResponse } from "./Common";
import { UserDetailsResponse } from "./User";
import { IProfile } from "../../models/User";
import mongoose from "mongoose";


export interface VerifyPhoneInput {
  phone?: string;
  otp?: string;
}

export interface ResendPhoneOtpInput {
  phone?: string;
}

export interface CaregiverInvitationStatusInput {
  patientUserId?: string;
  status?: "accepted" | "rejected";
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
  verified?: boolean;
  conflict?: boolean;
  conflictMessage?: string;
}

export interface OnboardingCaregiverInput {
  name?: string;
  phone?: string;
  relation?: string;
}

export interface OnboardingPreferencesInput {
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  shareActivityWithCaregiver?: boolean;
}

export interface EditProfileInput {
  name?: string;
  phone?: string;
  email?: string;
  onboarding?: {
    completed?: boolean;
    step?: number;
  };
  routines?: any;
  profile?: Partial<IProfile>;
  languages?: string[];
  preferences?: OnboardingPreferencesInput;
  caregivers?: OnboardingCaregiverInput[];
  verified?: boolean;
  routinesEnabled?: boolean;
}

export interface AuthUserResponse extends UserDetailsResponse {
  access: string;
  refresh: string;
}

export interface AuthenticationRequiredResponse extends ErrorMessageResponse {
}
