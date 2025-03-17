
import { supabase } from '../lib/supabase';
import { ApiError } from '../utils/errors';

export class ApiService {
  protected handleError(error: any): never {
    console.error('API Error:', error);
    
    // Determine the error type and create appropriate error
    if (error.code === 'PGRST116') {
      throw new ApiError('Not found', 404, error);
    } else if (error.code === 'PGRST109') {
      throw new ApiError('Conflict', 409, error);
    } else if (error.code?.startsWith('23')) {
      throw new ApiError('Validation error', 400, error);
    } else if (error.code === '42501') {
      throw new ApiError('Unauthorized', 403, error);
    } else {
      throw new ApiError('An unexpected error occurred', 500, error);
    }
  }

  protected async handleResponse<T>(promise: Promise<{ data: T | null; error: any }>): Promise<T> {
    try {
      const { data, error } = await promise;
      
      if (error) {
        this.handleError(error);
      }
      
      if (data === null) {
        throw new ApiError('Not found', 404);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleError(error);
    }
  }
}
