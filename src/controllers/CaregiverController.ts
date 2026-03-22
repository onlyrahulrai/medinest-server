import {
  Controller,
  Get,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import * as AuthService from "../services/authService";
import { AuthenticationRequiredResponse, CaregiverLookupResponse } from "../types/schema/Auth";
import { ErrorMessageResponse } from "../types/schema/Common";

@Route("caregivers")
@Tags("Caregivers")
export class CaregiverController extends Controller {
  @Security("jwt")
  @Get("lookup")
  @SuccessResponse<CaregiverLookupResponse>(200, "Caregiver lookup completed")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters or format")
  public async lookupCaregiver(
    @Request() req: any,
    @Query() phoneNumber?: string
  ): Promise<CaregiverLookupResponse | AuthenticationRequiredResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        return { message: "Authentication required" };
      }

      if (!phoneNumber) {
        this.setStatus(400);
        return { message: "phoneNumber is required" };
      }

      this.setStatus(200);
      return await AuthService.lookupCaregiverByPhone(phoneNumber, String(userId));
    } catch (error: any) {
      this.setStatus(400);
      return { message: error?.message || "Invalid request" };
    }
  }
}