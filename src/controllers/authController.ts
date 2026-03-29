import {
  Controller,
  Post,
  Get,
  Route,
  Tags,
  Body,
  SuccessResponse,
  Response,
  Request,
  Security,
  Put,
} from "tsoa";
import * as AuthService from "../services/authService";
import {
  validateEditProfile,
  validateVerifyPhone,
  validateResendPhoneOtp,
} from "../helper/validators/auth";
import {
  AuthenticationRequiredResponse,
  AuthUserResponse,
  EditProfileInput,
  VerifyPhoneInput,
  ResendPhoneOtpInput,
} from "../types/schema/Auth";
import { UserDetailsResponse } from "../types/schema/User";
import {
  ErrorMessageResponse,
  FieldValidationError,
  SuccessMessageResponse,
} from "../types/schema/Common";
import { API_MESSAGES } from "../constraints/common";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  @Post("send-phone-otp")
  @SuccessResponse(200, "Verification OTP sent")
  @Response<FieldValidationError>(422, "One or more fields failed validation")
  @Response<ErrorMessageResponse>(400, "Failed to send Verification OTP")
  public async sendPhoneOtp(
    @Body() body: ResendPhoneOtpInput
  ): Promise<SuccessMessageResponse | FieldValidationError | ErrorMessageResponse> {
    try {
      const fields = validateResendPhoneOtp(body);

      if (Object.keys(fields).length > 0) {
        this.setStatus(422);
        return { fields };
      }

      await AuthService.sendPhoneOtp(body.phone);

      this.setStatus(200);

      return { message: "Verification OTP has been sent" };
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || API_MESSAGES.OTP_FAILED };
    }
  }

  @Post("login-with-otp")
  @SuccessResponse<AuthUserResponse>(200, "OTP Login successful")
  @Response<FieldValidationError>(422, "One or more fields failed validation")
  @Response<ErrorMessageResponse>(400, "Invalid OTP or phone number")
  public async loginWithOtp(
    @Body() body: VerifyPhoneInput
  ): Promise<AuthUserResponse | FieldValidationError | ErrorMessageResponse> {
    try {
      const fields = validateVerifyPhone(body);

      if (Object.keys(fields).length > 0) {
        this.setStatus(422);
        return { fields };
      }

      const user = await AuthService.loginWithOtp(body.phone as string, body.otp as string);

      this.setStatus(200);

      return user as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || API_MESSAGES.LOGIN_FAILED };
    }
  }

  @Security("jwt")
  @Get("user-details")
  @SuccessResponse<UserDetailsResponse>(200, "User details retrieved successfully")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters or format")
  @Response<AuthenticationRequiredResponse>(
    401,
    "Authentication required to perform this action"
  )
  public async getUserDetails(
    @Request() req: any
  ): Promise<
    UserDetailsResponse | AuthenticationRequiredResponse | ErrorMessageResponse
  > {
    const userId = req.user?._id;

    if (!userId) {
      this.setStatus(401);
      return { message: "Authentication required" };
    }

    try {
      this.setStatus(200);

      return await AuthService.getUserDetails(userId) as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Put("edit-profile")
  @SuccessResponse<AuthUserResponse>(200, "Profile updated successfully")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters or format")
  @Response<FieldValidationError>(422, "One or more fields failed validation")
  @Response<AuthenticationRequiredResponse>(
    401,
    "Authentication required to perform this action"
  )
  public async editProfile(
    @Request() req: any,
    @Body() body: EditProfileInput
  ): Promise<
    | AuthUserResponse
    | ErrorMessageResponse
    | FieldValidationError
    | AuthenticationRequiredResponse
  > {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      const fields = await validateEditProfile(userId, body);

      if (Object.keys(fields).length > 0) {
        this.setStatus(422);
        return {
          fields,
        };
      }

      const user = await AuthService.editUserProfile(userId, body);

      this.setStatus(200);

      return user as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message };
    }
  }

  @Post("logout")
  @SuccessResponse("200", "Successfully logged out")
  @Response("401", "Unauthorized")
  public async logout(@Request() req: any): Promise<{ message: string }> {
    try {
      await AuthService.logout(req);

      return { message: "Successfully logged out" };
    } catch (error) {
      this.setStatus(401);
      return { message: "Invalid token" };
    }
  }
}
