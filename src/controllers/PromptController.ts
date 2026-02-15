import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Path,
  Body,
  Security,
  SuccessResponse,
  Response,
  Query,
  Patch,
} from "tsoa";

import * as PromptService from "../services/promptService";
import { Types } from "mongoose";

import {
  PromptRequest,
  PromptResponse,
  PromptListResponse,
  PromptPatchRequest,
} from "../types/schema/Prompt";

import {
  ErrorMessageResponse,
  FieldValidationError,
  SuccessMessageResponse,
} from "../types/schema/Common";

import { AuthenticationRequiredResponse } from "../types/schema/Auth";

@Route("prompts")
@Tags("Prompt")
export class PromptController extends Controller {
  /**
   * PromptController
   *
   * - All endpoints require authentication (Admin only)
   * - Supports global + assessment-level prompts
   */

  /** Get all prompts */
  @Security("jwt")
  @Get("/")
  @SuccessResponse(200, "List of prompts retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid request")
  public async getPrompts(
    @Query() page?: number,
    @Query() limit?: number,
    @Query() assessment?: string,
    @Query() flag?: string,
    @Query() fields?: string
  ): Promise<PromptListResponse> {
    return await PromptService.getAllPrompts(
      page,
      limit,
      assessment,
      flag,
      fields
    ) as PromptListResponse;
  }

  /** Get prompt by ID */
  @Security("jwt")
  @Get("{id}")
  @SuccessResponse(200, "Prompt retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid prompt id supplied")
  public async getPrompt(
    @Path() id: string
  ): Promise<PromptResponse | null> {
    return await PromptService.getPromptById(id) as PromptResponse | null;
  }

  /** Create new prompt */
  @Security("jwt")
  @Post("/")
  @SuccessResponse(201, "Prompt created successfully")
  @Response<FieldValidationError>(422, "Validation error")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters")
  public async createPrompt(
    @Body() body: PromptRequest
  ): Promise<PromptResponse> {
    const promptData = {
      ...body,
      assessment: body.assessment
        ? new Types.ObjectId(body.assessment)
        : null,
    };

    try {
      return await PromptService.createPrompt(
        promptData
      ) as unknown as PromptResponse;
    } catch (error: any) {
      let status = 400;
      let errors: any = {};

      // Duplicate key error (E11000)
      if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "field";

        status = 422;

        errors = {
          type: "fields",
          errors: {
            [field]: `This ${field} already has an active prompt.`,
          },
        };
      } else {
        errors = {
          type: "error",
          message:
            error?.message ||
            "Something went wrong while creating prompt",
        } as ErrorMessageResponse;
      }

      this.setStatus(status);
      return errors as PromptResponse;
    }
  }

  /** Update existing prompt */
  @Security("jwt")
  @Put("{id}")
  @SuccessResponse(200, "Prompt updated successfully")
  @Response<FieldValidationError>(422, "Validation error")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async updatePrompt(
    @Path() id: string,
    @Body() body: PromptRequest
  ): Promise<PromptResponse> {
    const promptData = {
      ...body,
      assessment: body.assessment
        ? new Types.ObjectId(body.assessment)
        : null,
    };

    try {
      return await PromptService.updatePrompt(
        id,
        promptData
      ) as unknown as PromptResponse;
    } catch (error: any) {
      let status = 400;
      let errors: any = {};

      if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "field";

        status = 422;

        errors = {
          type: "fields",
          errors: {
            [field]: `This ${field} already has an active prompt.`,
          },
        };
      } else {
        errors = {
          type: "error",
          message:
            error?.message ||
            "Something went wrong while updating prompt",
        } as ErrorMessageResponse;
      }

      this.setStatus(status);
      return errors as PromptResponse;
    }
  }

  /** Partially update existing prompt */
  @Security("jwt")
  @Patch("{id}")
  @SuccessResponse(200, "Prompt partially updated successfully")
  @Response<FieldValidationError>(422, "Validation error")
  @Response<ErrorMessageResponse>(400, "Invalid request parameters")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  public async patchPrompt(
    @Path() id: string,
    @Body() body: PromptPatchRequest
  ): Promise<PromptResponse> {

    const updateData: any = { ...body };

    // Only convert assessment if provided
    if (body.assessment !== undefined) {
      updateData.assessment = body.assessment
        ? new Types.ObjectId(body.assessment)
        : null;
    }

    try {
      return await PromptService.updatePrompt(
        id,
        updateData
      ) as unknown as PromptResponse;

    } catch (error: any) {
      let status = 400;
      let errors: any = {};

      if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "field";

        status = 422;

        errors = {
          type: "fields",
          errors: {
            [field]: `This ${field} already has an active prompt.`,
          },
        };
      } else {
        errors = {
          type: "error",
          message:
            error?.message ||
            "Something went wrong while updating prompt",
        } as ErrorMessageResponse;
      }

      this.setStatus(status);
      return errors as PromptResponse;
    }
  }

  /** Delete prompt (soft delete) */
  @Security("jwt")
  @Delete("{id}")
  @SuccessResponse<SuccessMessageResponse>(200, "Prompt deleted successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid prompt id supplied")
  public async deletePrompt(
    @Path() id: string
  ): Promise<SuccessMessageResponse> {
    await PromptService.deletePrompt(id);
    return { message: "Prompt deleted successfully" };
  }
}
