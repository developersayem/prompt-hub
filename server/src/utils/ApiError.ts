class ApiError extends Error {
  public statusCode: number;
  public data: null;
  public error: unknown[];
  
  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: unknown[] = [],
    stack: string = ""
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.data = null;
    this.error = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
