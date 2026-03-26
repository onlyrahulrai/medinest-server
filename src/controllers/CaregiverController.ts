import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
  Path,
  Body,
  Middlewares,
} from "tsoa";
import * as CaregiverService from "../services/caregiverService";
import { AuthenticationRequiredResponse } from "../types/schema/Auth";
import { AccessDeniedErrorMessageResponse, ErrorMessageResponse, FieldValidationError } from "../types/schema/Common";
import { PERMISSIONS } from "../constraints/permissions";
import { requirePermission } from "../middleware/requirePermission";
import { CreateCaregiverRequest, UpdateCaregiverRequest, RespondInvitationRequest } from "../types/schema/Caregiver";
import { validateManageCaregiver, validateUpdateCaregiver } from "../helper/validators/caregiver";

@Route("caregiver")
@Tags("Caregiver")
export class CaregiverController extends Controller {

  /** Get caregivers for a patient */
  @Get("/")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_VIEW))
  @SuccessResponse(200, "Caregivers retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  public async getCaregivers(
    @Request() req: any
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return await CaregiverService.getCaregivers(String(userId));
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to retrieve caregivers" };
    }
  }
  /** Get caregivers for a patient */
  @Get("/:caregiverId")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_VIEW))
  @SuccessResponse(200, "Caregivers retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  public async getCaregiverDetails(
    @Path() caregiverId: string
  ): Promise<any> {
    try {
      this.setStatus(200);
      return await CaregiverService.getCaregiverDetails(String(caregiverId));
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to retrieve caregivers" };
    }
  }

  /** Add a new caregiver */
  @Post("/")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_CREATE))
  @SuccessResponse(201, "Caregiver added successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  @Response<FieldValidationError>(422, "Validation Failed")
  public async addCaregiver(
    @Request() req: any,
    @Body() body: CreateCaregiverRequest
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      const fields = validateManageCaregiver(body);

      if (Object.keys(fields).length > 0) {
        this.setStatus(422);
        return { fields };
      }

      const result = await CaregiverService.addCaregiver(String(userId), body);

      this.setStatus(201);

      return result;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to add caregiver" };
    }
  }

  /** Update an existing caregiver */
  @Put("/{caregiverId}")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_UPDATE))
  @SuccessResponse(200, "Caregiver updated successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  @Response<FieldValidationError>(422, "Validation Failed")
  public async updateCaregiver(
    @Request() req: any,
    @Path() caregiverId: string,
    @Body() body: UpdateCaregiverRequest
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      const fields = validateUpdateCaregiver(body);
      if (Object.keys(fields).length > 0) {
        this.setStatus(422);
        return { fields };
      }

      const result = await CaregiverService.updateCaregiver(String(userId), caregiverId, body);
      this.setStatus(200);
      return result;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to update caregiver" };
    }
  }

  /** Remove a caregiver */
  @Delete("/{caregiverId}")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_DELETE))
  @SuccessResponse(200, "Caregiver removed successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  public async removeCaregiver(
    @Request() req: any,
    @Path() caregiverId: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      this.setStatus(200);

      return await CaregiverService.removeCaregiver(String(userId), caregiverId);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to remove caregiver" };
    }
  }

  /** Get invitations for current user (acting as caregiver) */
  @Get("invitations")
  @Security("jwt")
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

  /** Respond to an invitation */
  @Post("/invitations/{invitationId}/respond")
  @Security("jwt")
  @SuccessResponse(200, "Invitation responded successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async respondToInvitation(
    @Request() req: any,
    @Path() invitationId: string,
    @Body() body: RespondInvitationRequest
  ): Promise<any> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      if (!body.status || !["accepted", "rejected"].includes(body.status)) {
        this.setStatus(400);
        return { message: "Invalid status" };
      }
      this.setStatus(200);
      return await CaregiverService.respondToCaregiverInvitationById(String(userId), invitationId, body.status);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }
}