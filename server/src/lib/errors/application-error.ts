export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class SourceDataNotFoundError extends ApplicationError {
  constructor(fileName: string) {
    super(
      `Required source data file was not found: ${fileName}.`,
      'SOURCE_DATA_NOT_FOUND',
      500,
      { fileName },
    );
  }
}

export class SourceDataReadError extends ApplicationError {
  constructor(fileName: string) {
    super(
      `Required source data file could not be read: ${fileName}.`,
      'SOURCE_DATA_READ_FAILED',
      500,
      { fileName },
    );
  }
}

export class InvalidJsonSourceError extends ApplicationError {
  constructor(fileName: string) {
    super(
      `Required source data file contains invalid JSON: ${fileName}.`,
      'INVALID_JSON_SOURCE',
      400,
      { fileName },
    );
  }
}

export class InvalidSourceShapeError extends ApplicationError {
  constructor(fileName: string, expectedShape: string) {
    super(
      `Required source data file has an unsupported shape: ${fileName}.`,
      'INVALID_SOURCE_SHAPE',
      400,
      { fileName, expectedShape },
    );
  }
}

export class DatabaseWriteError extends ApplicationError {
  constructor() {
    super(
      'The integrated report could not be persisted.',
      'DATABASE_WRITE_FAILED',
      500,
    );
  }
}
