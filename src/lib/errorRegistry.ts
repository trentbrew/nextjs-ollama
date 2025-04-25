export interface LoggedError {
  timestamp: Date;
  agent: string;
  error: Error;
}

/**
 * A central registry for logging errors across agents and orchestration.
 * Implemented as a Singleton.
 */
class ErrorRegistry {
  private static instance: ErrorRegistry;
  private errors: LoggedError[] = [];

  private constructor() {}

  public static getInstance(): ErrorRegistry {
    if (!ErrorRegistry.instance) {
      ErrorRegistry.instance = new ErrorRegistry();
    }
    return ErrorRegistry.instance;
  }

  /**
   * Adds an error entry with the agent name and timestamp.
   */
  public addError(agent: string, error: Error): void {
    this.errors.push({ timestamp: new Date(), agent, error });
    console.error(`[ErrorRegistry] [${agent}]`, error);
  }

  /**
   * Retrieves all logged errors.
   */
  public getErrors(): LoggedError[] {
    return this.errors;
  }
}

// Export the singleton instance
export const errorRegistry = ErrorRegistry.getInstance();
