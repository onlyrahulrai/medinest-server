import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import * as AuthService from "../services/authService";
import { AuthenticationRequiredResponse, CaregiverLookupResponse, OnboardingCaregiverInput } from "../types/schema/Auth";
import { UserDetailsResponse } from "../types/schema/User";
import { ErrorMessageResponse } from "../types/schema/Common";

@Route("caregivers")
@Tags("Caregivers")
export class CaregiverController extends Controller {
  @Security("jwt")
  @Post("upsert-invitation")
  @SuccessResponse(200, "Caregiver invitation saved")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters")
  public async upsertInvitation(
    @Request() req: any,
    @Body() body: OnboardingCaregiverInput
  ): Promise<UserDetailsResponse | AuthenticationRequiredResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return (await AuthService.upsertCaregiverInvitation(String(userId), body)) as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Delete("remove")
  @SuccessResponse(200, "Caregiver removed")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters")
  public async removeCaregiver(
    @Request() req: any,
    @Query() phoneNumber: string
  ): Promise<UserDetailsResponse | AuthenticationRequiredResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return (await AuthService.removeCaregiverInvitation(String(userId), phoneNumber)) as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Get("invitations")
  @SuccessResponse(200, "Invitations retrieved")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async getInvitations(
    @Request() req: any,
    @Query() phone?: string
  ): Promise<any> {
    try {
      const userPhone = phone || req.user?.phone;
      if (!userPhone) {
        this.setStatus(400);
        return { message: "Phone number is required" };
      }
      this.setStatus(200);
      return await AuthService.getInvitationsForUserByPhone(userPhone);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Post("invitation-response")
  @SuccessResponse(200, "Invitation response saved")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async respondToInvitation(
    @Request() req: any,
    @Body() body: { invitationId: string; status: "accepted" | "rejected" }
  ): Promise<any> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return await AuthService.respondToCaregiverInvitationById(String(userId), body.invitationId, body.status);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }
}