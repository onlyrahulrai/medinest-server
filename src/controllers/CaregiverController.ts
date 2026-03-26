import { Controller, Post, Get, Delete, Query, Request, Response, Route, Security, SuccessResponse, Tags, Path } from "tsoa";
import * as CaregiverService from "../services/caregiverService";
import { AuthenticationRequiredResponse } from "../types/schema/Auth";
import { ErrorMessageResponse } from "../types/schema/Common";

@Route("caregiver")
@Tags("Caregivers")
export class CaregiverController extends Controller {
  @Security("jwt")
  @Get("invitations")
  @SuccessResponse(200, "Invitations retrieved")
  @Response<ErrorMessageResponse>(401, "Authentication required")
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
      return await CaregiverService.getInvitationsForUserByPhone(userPhone);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Post("invitations/{id}/accept")
  @SuccessResponse(200, "Invitation accepted")
  @Response<ErrorMessageResponse>(401, "Authentication required")
  public async acceptInvitation(
    @Request() req: any,
    @Path() id: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return await CaregiverService.respondToCaregiverInvitationById(String(userId), id, "accepted");
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Post("invitations/{id}/reject")
  @SuccessResponse(200, "Invitation rejected")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async rejectInvitation(
    @Request() req: any,
    @Path() id: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return await CaregiverService.respondToCaregiverInvitationById(String(userId), id, "rejected");
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }

  @Security("jwt")
  @Delete("{id}")
  @SuccessResponse(200, "Caregiver removed")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async removeCaregiver(
    @Request() req: any,
    @Path() id: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      this.setStatus(200);

      return await CaregiverService.removeCaregiver(String(userId), id);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }
}