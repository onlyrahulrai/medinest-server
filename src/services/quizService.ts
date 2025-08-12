import QuizModel from "../models/Quiz"; // your mongoose Quiz model
import QuizAttemptModel from "../models/QuizAttempt"; // mongoose QuizAttempt model

interface PaginationParams {
  page?: number;
  limit?: number;
}

export async function getAllQuizzes({ page = 1, limit = 10 }: PaginationParams) {
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    QuizModel.find().skip(skip).limit(limit).lean(),
    QuizModel.countDocuments(),
  ]);

  return {
    results,
    total,
    page,
    limit,
  };
}

export async function getQuizById(id: string) {
  return await QuizModel.findById(id).lean();
}

export async function createQuiz(data: any) {
  const quiz = new QuizModel(data);
  await quiz.save();
  return quiz.toObject();
}

export async function updateQuiz(id: string, data: any) {
  const quiz = await QuizModel.findByIdAndUpdate(id, data, { new: true });
  return quiz ? quiz.toObject() : null;
}

export async function deleteQuiz(id: string) {
  await QuizModel.findByIdAndDelete(id);
}

// Get quiz attempts for a quiz, optionally filtered by userId
export async function getQuizAttempts(quizId: string, userId?: string) {
  const filter: any = { quiz: quizId };
  if (userId) filter.user = userId;

  const results = await QuizAttemptModel.find(filter).lean();
  const total = await QuizAttemptModel.countDocuments(filter);

  return {
    results,
    total,
    page: 1,
    limit: results.length,
  };
}
