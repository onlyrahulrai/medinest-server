import {
  Controller,
  Get,
  Post,
  Put,
  Route,
  Tags,
  Path,
  Body,
  Security,
  SuccessResponse,
  Response,
} from "tsoa";

import * as QuizAttemptService from "../services/quizAttemptService";
import {
  QuizAttemptListResponse,
  QuizAttemptResponse,
  SubmitAnswersRequest,
} from "../types/schema/QuizAttempt";

import {
  ErrorMessageResponse,
} from "../types/schema/Common";
import { AuthenticationRequiredResponse } from "../types/schema/Auth";
import { QuestionResponse } from "../types/schema/Question";

@Route("quiz-attempts")
@Tags("QuizAttempt")
export class QuizAttemptController extends Controller {
  private getCurrentUserId(): string {
    // Adapt this according to your auth middleware (example: Express request user)
    return (this.request as any).user.id;
  }

  @Security("jwt")
  @Post("start/{quizId}")
  @SuccessResponse<QuizAttemptResponse>(201, "Quiz attempt started")
  @Response<ErrorMessageResponse>(400, "Invalid quiz id or user")
  public async startAttempt(
    @Path() quizId: string
  ): Promise<QuizAttemptResponse> {
    const userId = this.getCurrentUserId();
    return QuizAttemptService.startAttempt(quizId, userId);
  }

  @Security("jwt")
  @Put("{attemptId}/submit")
  @SuccessResponse<QuizAttemptResponse>(200, "Answers submitted")
  @Response<ErrorMessageResponse>(400, "Invalid attempt id or answers")
  public async submitAnswers(
    @Path() attemptId: string,
    @Body() answers: SubmitAnswersRequest
  ): Promise<QuizAttemptResponse> {
    return QuizAttemptService.submitAnswers(attemptId, answers);
  }

  @Security("jwt")
  @Get("{attemptId}")
  @SuccessResponse<QuizAttemptResponse>(200, "Quiz attempt retrieved")
  @Response<ErrorMessageResponse>(400, "Invalid attempt id")
  public async getAttempt(
    @Path() attemptId: string
  ): Promise<QuizAttemptResponse> {
    const userId = this.getCurrentUserId();
    return QuizAttemptService.getAttemptById(attemptId, userId);
  }

  @Security("jwt")
  @Get("{attemptId}/next-question")
  @SuccessResponse<QuestionResponse>(200, "Next question retrieved successfully")
  @Response<AuthenticationRequiredResponse>(401, "Authentication required")
  @Response<ErrorMessageResponse>(400, "Invalid attempt id or no more questions")
  public async getNextQuestion(
    @Path() attemptId: string
  ): Promise<QuestionResponse> {
    const userId = this.getCurrentUserId();
    return QuizAttemptService.getNextQuestion(attemptId, userId);
  }
}
