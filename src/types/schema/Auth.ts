import { ErrorMessageResponse } from "./Common";
import { UserDetailsResponse } from "./User";

export interface VerifyPhoneInput {
  phone?: string;
  otp?: string;
}

export interface ResendPhoneOtpInput {
  phone?: string;
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
