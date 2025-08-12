export interface FieldValidationError {
  type?: string;
  errors?: Record<string, string>;
}

export interface ErrorMessageResponse {
  type?: string;
  message?: string;
}

export interface SuccessMessageResponse {
  message: string;
}
