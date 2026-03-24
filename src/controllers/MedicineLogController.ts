import {
  Controller,
  Post,
  Get,
  Put,
  Route,
  Tags,
  Body,
  Request,
  Security,
  Path,
  Query,
} from "tsoa";
import * as MedicineLogService from "../services/medicineLogService";
import { MedicineLogResponse } from "../types/schema/Medicine";
import { ErrorMessageResponse } from "../types/schema/Common";

@Route("medicine-logs")
@Tags("MedicineLogs")
@Security("jwt")
export class MedicineLogController extends Controller {
  /**
   * Get today's logs for the logged-in user.
   */
  @Get("today")
  public async getTodaysLogs(
    @Request() req: any,
    @Query() patientId?: string
  ): Promise<MedicineLogResponse[] | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      return await MedicineLogService.getTodaysLogs(String(userId), patientId) as any;
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }

  /**
   * Update the status of a specific log entry (taken, skipped, etc.).
   */
  @Put("{id}/status")
  public async updateLogStatus(
    @Request() req: any,
    @Path() id: string,
    @Body() body: { status: 'taken' | 'skipped' | 'missed', notes?: string }
  ): Promise<MedicineLogResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      const log = await MedicineLogService.updateLogStatus(id, String(userId), body.status, body.notes);
      if (!log) {
        this.setStatus(404);
        return { message: "Log entry not found" };
      }
      return log as any;
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message };
    }
  }
}
