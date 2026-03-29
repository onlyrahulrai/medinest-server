import {
  Controller,
  Get,
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
  Patch,
} from "tsoa";
import * as CaregiverRelationService from "../services/caregiverRelationService";
import { AuthenticationRequiredResponse } from "../types/schema/Auth";
import { AccessDeniedErrorMessageResponse, ErrorMessageResponse, FieldValidationError } from "../types/schema/Common";
import { UpdateCaregiverRequest } from "../types/schema/Caregiver";
import { validateUpdateCaregiver } from "../helper/validators/caregiver";

@Route("caregiver/relations")
@Tags("Caregiver Relations")
export class CaregiverRelationController extends Controller {

  /** Get caregiver relations for current user */
  @Get()
  @Security("jwt")
  @SuccessResponse(200, "Relations retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  public async getRelations(
    @Request() req: any,
    @Query() role?: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }
      this.setStatus(200);
      return await CaregiverRelationService.getRelations(String(userId), role);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to retrieve relations" };
    }
  }

  /** Get caregiver relation details */
  @Get("{relationId}")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_VIEW))
  @SuccessResponse(200, "Relation details retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  public async getRelationDetails(
    @Request() req: any,
    @Path() relationId: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      this.setStatus(200);
      return await CaregiverRelationService.getRelationDetails(String(userId), relationId);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to retrieve relation details" };
    }
  }

  /** Update an existing caregiver relation */
  @Patch("{relationId}")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_UPDATE))
  @SuccessResponse(200, "Relation updated successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  @Response<FieldValidationError>(422, "Validation Failed")
  public async updateRelation(
    @Request() req: any,
    @Path() relationId: string,
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

      const result = await CaregiverRelationService.updateRelation(String(userId), relationId, body);
      this.setStatus(200);
      return result;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to update relation" };
    }
  }

  /** Remove a caregiver relation */
  @Delete("{relationId}")
  @Security("jwt")
  // @Middlewares(requirePermission(PERMISSIONS.CAREGIVER_DELETE))
  @SuccessResponse(200, "Relation removed successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<AccessDeniedErrorMessageResponse>(403, "Access denied")
  public async removeRelation(
    @Request() req: any,
    @Path() relationId: string
  ): Promise<any> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      this.setStatus(200);

      return await CaregiverRelationService.removeRelation(String(userId), relationId);
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Failed to remove relation" };
    }
  }
}