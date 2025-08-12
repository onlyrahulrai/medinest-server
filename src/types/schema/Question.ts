export interface QuestionOption {
  text: string;
  // Optionally, you can hide `isCorrect` on response if you don't want to reveal answers
  // isCorrect?: boolean;
}

export interface QuestionMedia {
  image?: string;
  video?: string;
  audio?: string;
}

export interface QuestionResponse {
  id: string; // Question ID
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "fill_blank" | "matching_pairs";
  options: QuestionOption[];
  media?: QuestionMedia;
  points: number;
  timeLimit: number; // seconds
}
