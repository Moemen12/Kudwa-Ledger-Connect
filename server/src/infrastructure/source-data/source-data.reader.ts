import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  InvalidJsonSourceError,
  SourceDataNotFoundError,
  SourceDataReadError,
} from '../../lib/errors/application-error';

@Injectable()
export class SourceDataReader {
  private readonly rawDataDirectory = join(process.cwd(), 'data', 'raw');

  async readRequiredJson<TData>(fileName: string): Promise<TData> {
    const filePath = join(this.rawDataDirectory, fileName);

    try {
      const content = await readFile(filePath, 'utf8');

      return JSON.parse(content) as TData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new InvalidJsonSourceError(fileName);
      }

      if (this.isFileNotFoundError(error)) {
        throw new SourceDataNotFoundError(fileName);
      }

      throw new SourceDataReadError(fileName);
    }
  }

  private isFileNotFoundError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}
