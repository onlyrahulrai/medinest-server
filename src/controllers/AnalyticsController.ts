import {
  Controller,
  Get,
  Path,
  Query,
  Route,
  Tags,
  Security,
  SuccessResponse,
  Response,
} from "tsoa";

import * as QuizAttemptService from "../services/quizAttemptService";
import {
  QuizAttemptResponse,
  QuizAttemptListResponse,
} from "../types/schema/QuizAttempt";

import {
  ErrorMessageResponse,
  SuccessMessageResponse,
} from "../types/schema/Common";

import { AuthenticationRequiredResponse } from "../types/schema/Auth";
import { LeaderboardResponse, QuizStatsResponse } from "../types/schema/Analytics";

@Route("analytics")
@Tags("Analytics")
export class AnalyticsController extends Controller {
  private getCurrentUserId(): string {
    return (this.request as any).user.id;
  }

  @Security("jwt")
  @Get("attempts/{attemptId}/results")
  @SuccessResponse<QuizAttemptResponse>(200, "Quiz attempt results retrieved")
  @Response<ErrorMessageResponse>(400, "Invalid attempt id")
  public async getAttemptResults(
    @Path() attemptId: string
  ): Promise<QuizAttemptResponse> {
    const userId = this.getCurrentUserId();
    return QuizAttemptService.getAttemptById(attemptId, userId);
  }

  @Security("jwt")
  @Get("user/me/history")
  @SuccessResponse<QuizAttemptListResponse>(200, "User quiz history retrieved")
  public async getUserQuizHistory(
    @Query() page?: number,
    @Query() limit?: number
  ): Promise<QuizAttemptListResponse> {
    const userId = this.getCurrentUserId();
    return QuizAttemptService.getUserAttempts(userId, page, limit);
  }

  @Security("jwt")
  @Get("leaderboard/{quizId}")
  @SuccessResponse<LeaderboardResponse>(200, "Leaderboard retrieved")
  @Response<ErrorMessageResponse>(400, "Invalid quiz id")
  public async getLeaderboard(
    @Path() quizId: string,
    @Query() limit?: number
  ): Promise<LeaderboardResponse> {
    return QuizAttemptService.getLeaderboard(quizId, limit);
  }

  @Security("jwt")
  @Get("quiz/{quizId}/stats")
  @SuccessResponse<QuizStatsResponse>(200, "Quiz statistics retrieved")
  @Response<ErrorMessageResponse>(400, "Invalid quiz id")
  public async getQuizStats(
    @Path() quizId: string
  ): Promise<QuizStatsResponse> {
    return QuizAttemptService.getQuizStatistics(quizId);
  }
}
