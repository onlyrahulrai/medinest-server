import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Route,
  Tags,
  Body,
  SuccessResponse,
  Request,
  Security,
  Path,
} from "tsoa";
import * as RoutineService from "../services/routineService";
import { AddRoutineInput, RoutineResponse } from "../types/schema/Medicine";
import { ErrorMessageResponse, SuccessMessageResponse } from "../types/schema/Common";

@Route("routines")
@Tags("Routines")
@Security("jwt")
export class RoutineController extends Controller {
  /**
   * Get all routines for the logged-in user.
   */
  @Get("/")
  public async getRoutines(@Request() req: any): Promise<RoutineResponse[] | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      return await RoutineService.getRoutinesByUserId(String(userId)) as any;
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }

  /**
   * Create a new routine.
   */
  @Post("/")
  @SuccessResponse(201, "Created")
  public async createRoutine(
    @Request() req: any,
    @Body() body: AddRoutineInput
  ): Promise<RoutineResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      return await RoutineService.createRoutine(String(userId), body) as any;
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }

  /**
   * Update a routine.
   */
  @Get("{id}")
  public async getRoutineById(
    @Request() req: any,
    @Path() id: string
  ): Promise<RoutineResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      const routine = await RoutineService.getRoutineById(id, String(userId));

      if (!routine) {
        this.setStatus(404);
        return { message: "Routine not found" };
      }

      return routine as any;
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }

  /**
   * Update a routine.
   */
  @Put("{id}")
  public async updateRoutine(
    @Request() req: any,
    @Path() id: string,
    @Body() body: Partial<AddRoutineInput>
  ): Promise<RoutineResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      const routine = await RoutineService.updateRoutine(id, String(userId), body);
      if (!routine) {
        this.setStatus(404);
        return { message: "Routine not found" };
      }
      return routine as any;
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }

  /**
   * Delete a routine.
   */
  @Delete("{id}")
  public async deleteRoutine(
    @Request() req: any,
    @Path() id: string
  ): Promise<SuccessMessageResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      const success = await RoutineService.deleteRoutine(id, String(userId));
      if (!success) {
        this.setStatus(404);
        return { message: "Routine not found" };
      }
      return { message: "Routine deleted successfully" };
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }
}
