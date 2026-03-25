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
  Response,
  Request,
  Security,
  Path,
  Query,
} from "tsoa";
import * as MedicineService from "../services/medicineService";
import { CreateMedicineInput, UpdateMedicineInput, MedicineResponse } from "../types/schema/Medicine";
import { ErrorMessageResponse, SuccessMessageResponse } from "../types/schema/Common";

@Route("medicines")
@Tags("Medicines")
@Security("jwt")
export class MedicineController extends Controller {
  /**
   * Add a new medicine for the logged-in user.
   */
  @Post("/")
  @SuccessResponse(201, "Medicine created successfully")
  @Response<ErrorMessageResponse>(400, "Validation failed or invalid input")
  public async createMedicine(
    @Request() req: any,
    @Body() body: CreateMedicineInput
  ): Promise<MedicineResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }

      this.setStatus(201);
      return await MedicineService.createMedicine(String(userId), body) as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error.message || "Failed to create medicine" };
    }
  }

  /**
   * Retrieve all medicines for the logged-in user, with optional filters.
   */
  @Get("/")
  public async getAllMedicines(
    @Request() req: any,
    @Query() status?: string,
    @Query() date?: string,
    @Query() patientId?: string
  ): Promise<MedicineResponse[] | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }

      this.setStatus(200);
      return await MedicineService.getAllMedicines(String(userId), status, date, patientId) as any[];
    } catch (error: any) {
      this.setStatus(400);
      return { message: error.message || "Failed to fetch medicines" };
    }
  }

  /**
   * Get full details of a single medicine.
   */
  @Get("{id}")
  public async getMedicineById(
    @Request() req: any,
    @Path() id: string
  ): Promise<MedicineResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }

      this.setStatus(200);
      return await MedicineService.getMedicineById(String(userId), id) as any;
    } catch (error: any) {
      this.setStatus(404);
      return { message: error.message || "Medicine not found" };
    }
  }

  /**
   * Update details of an existing medicine.
   */
  @Put("{id}")
  public async updateMedicine(
    @Request() req: any,
    @Path() id: string,
    @Body() body: UpdateMedicineInput
  ): Promise<MedicineResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }

      this.setStatus(200);
      return await MedicineService.updateMedicine(String(userId), id, body) as any;
    } catch (error: any) {
      this.setStatus(400);
      return { message: error.message || "Failed to update medicine" };
    }
  }

  /**
   * Soft-delete a medicine (mark as inactive).
   */
  @Delete("{id}")
  public async deleteMedicine(
    @Request() req: any,
    @Path() id: string
  ): Promise<SuccessMessageResponse | ErrorMessageResponse> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }

      await MedicineService.deleteMedicine(String(userId), id);
      this.setStatus(200);
      return { message: "Medicine deleted successfully" };
    } catch (error: any) {
      this.setStatus(400);
      return { message: error.message || "Failed to delete medicine" };
    }
  }
}
