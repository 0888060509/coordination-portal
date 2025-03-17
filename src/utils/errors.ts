
export class ApiError extends Error {
  status: number;
  originalError?: any;

  constructor(message: string, status: number, originalError?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.originalError = originalError;
  }
}
