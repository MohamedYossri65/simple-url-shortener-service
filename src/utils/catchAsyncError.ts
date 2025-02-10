import { InternalServerErrorException ,HttpException} from '@nestjs/common';

export const catchAsyncErr = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }
      // For unexpected errors, throw an InternalServerErrorException
      throw new InternalServerErrorException(error.message || 'Internal Server Error');
    }
  };
};