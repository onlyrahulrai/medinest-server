import {
    Controller,
    Post,
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
import * as CaregiverInvitationService from "../services/caregiverInvitationService";
import { AuthenticationRequiredResponse } from "../types/schema/Auth";
import { ErrorMessageResponse, FieldValidationError } from "../types/schema/Common";
import { RespondInvitationRequest, CreateInvitationRequest } from "../types/schema/Caregiver";
import { validateCreateInvitation } from "../helper/validators/caregiver";

@Route("caregiver/invitations")
@Tags("Caregiver Invitations")
export class CaregiverInvitationController extends Controller {

    /** Create caregiver invitation */
    @Post()
    @Security("jwt")
    @SuccessResponse(201, "Invitation sent successfully")
    @Response<AuthenticationRequiredResponse>(401, "Authentication required")
    @Response<FieldValidationError>(422, "Validation Failed")
    public async createInvitation(
        @Request() req: any,
        @Body() body: CreateInvitationRequest
    ): Promise<any> {
        try {
            const userId = req.user?._id;

            if (!userId) {
                this.setStatus(401);
                return { message: "Authentication required" };
            }

            const fields = validateCreateInvitation(body);

            if (Object.keys(fields).length > 0) {
                this.setStatus(422);
                return { fields };
            }

            const result = await CaregiverInvitationService.createInvitation(String(userId), body);

            this.setStatus(201);
            return result;
        } catch (error: any) {
            this.setStatus(400);
            return { message: error?.message || "Failed to create invitation" };
        }
    }

    /** Get invitations for current user */
    @Get()
    @Security("jwt")
    @SuccessResponse(200, "Invitations retrieved")
    @Response<ErrorMessageResponse>(401, "Authentication required")
    public async getInvitations(
        @Request() req: any,
        @Query() type?: "incoming" | "sent",
        @Query() status?: string
    ): Promise<any> {
        try {
            const userId = req.user?._id;

            if (!userId) {
                this.setStatus(401);
                return { message: "Authentication required" };
            }

            this.setStatus(200);

            return await CaregiverInvitationService.getInvitationsForUser(String(userId), type, status);
        } catch (error: any) {
            console.error("Error fetching invitations:", error);

            this.setStatus(400);
            return { message: error?.message || "Invalid request" };
        }
    }

    /** Get specific invitation */
    @Get("{id}")
    @Security("jwt")
    @SuccessResponse(200, "Invitation retrieved")
    @Response<ErrorMessageResponse>(401, "Authentication required")
    @Response<ErrorMessageResponse>(404, "Invitation not found")
    public async getInvitationById(
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

            return await CaregiverInvitationService.getInvitationById(String(userId), id);
        } catch (error: any) {
            console.error("Error fetching invitation:", error);

            this.setStatus(400);
            return { message: error?.message || "Invalid request" };
        }
    }

    /** Respond to an invitation */
    @Patch("{id}/respond")
    @Security("jwt")
    @SuccessResponse(200, "Invitation responded successfully")
    @Response<AuthenticationRequiredResponse>(401, "Authentication required")
    public async respondToInvitation(
        @Request() req: any,
        @Path() id: string,
        @Body() body: RespondInvitationRequest
    ): Promise<any> {
        try {
            const userId = req.user?._id;

            if (!userId) {
                this.setStatus(401);
                return { message: "Authentication required" };
            }

            if (!body.action || !["accept", "reject"].includes(body.action)) {
                this.setStatus(400);
                return { message: "Invalid action" };
            }

            this.setStatus(200);
            
            return await CaregiverInvitationService.respondToInvitation(String(userId), id, body.action);
        } catch (error: any) {
            this.setStatus(400);
            return { message: error?.message || "Invalid request" };
        }
    }

    /** Resend invitation */
    @Post("{id}/resend")
    @Security("jwt")
    @SuccessResponse(200, "Invitation resent successfully")
    @Response<AuthenticationRequiredResponse>(401, "Authentication required")
    public async resendInvitation(
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
            return await CaregiverInvitationService.resendInvitation(String(userId), id);
        } catch (error: any) {
            this.setStatus(400);
            return { message: error?.message || "Invalid request" };
        }
    }

    /** Delete invitation */
    @Delete("{id}")
    @Security("jwt")
    @SuccessResponse(200, "Invitation deleted successfully")
    @Response<AuthenticationRequiredResponse>(401, "Authentication required")
    public async deleteInvitation(
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
            return await CaregiverInvitationService.deleteInvitation(String(userId), id);
        } catch (error: any) {
            this.setStatus(400);
            return { message: error?.message || "Invalid request" };
        }
    }
}