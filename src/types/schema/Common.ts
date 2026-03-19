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

export interface ErrorResponse {
  message?: string;
}

export interface ValidateError {
  fields?: Record<string, string>;
}

export interface AccessDeniedErrorMessageResponse extends ErrorResponse { }

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  results: Partial<T>[];
}