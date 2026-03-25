import {
  Controller,
  Get,
  Put,
  Route,
  Tags,
  Body,
  Security,
  Request,
} from "tsoa";
import mongoose from "mongoose";
import User from "../models/User";
import { GlobalScheduleResponse, UpdateGlobalScheduleInput } from "../types/schema/User";

@Route("schedule/global")
@Tags("Schedule")
@Security("jwt")
export class GlobalScheduleController extends Controller {
  /**
   * Fetch the global dosage schedule for the logged-in user.
   */
  @Get("/")
  public async getGlobalSchedule(@Request() req: any): Promise<GlobalScheduleResponse> {
    const userId = req.user?._id;
    const user = await User.findById(userId).select("globalSchedule");
    if (!user) {
      throw new Error("User not found");
    }

    const schedule = user.globalSchedule || { times: ["09:00", "21:00"], updatedAt: new Date() };
    return {
      times: schedule.times,
      updatedAt: schedule.updatedAt,
    };
  }

  /**
   * Update the global dosage schedule for the logged-in user.
   */
  @Put("/")
  public async updateGlobalSchedule(
    @Request() req: any,
    @Body() body: UpdateGlobalScheduleInput
  ): Promise<GlobalScheduleResponse> {
    const userId = req.user?._id;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          globalSchedule: {
            times: body.times,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    const schedule = user.globalSchedule!;
    return {
      times: schedule.times,
      updatedAt: schedule.updatedAt,
    };
  }
}
