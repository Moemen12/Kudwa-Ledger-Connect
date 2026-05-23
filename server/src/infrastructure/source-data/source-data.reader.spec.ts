import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  InvalidJsonSourceError,
  SourceDataNotFoundError,
} from '../../lib/errors/application-error';
import { SourceDataReader } from './source-data.reader';

describe('SourceDataReader', () => {
  let originalCwd: string;
  let tempDirectory: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDirectory = await mkdtemp(join(tmpdir(), 'kudwa-source-data-'));
    process.chdir(tempDirectory);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('throws a typed error when a required source file is missing', async () => {
    const reader = new SourceDataReader();

    await expect(
      reader.readRequiredJson('missing.json'),
    ).rejects.toBeInstanceOf(SourceDataNotFoundError);
  });

  it('throws a typed error when source JSON is invalid', async () => {
    await mkdir(join(tempDirectory, 'data', 'raw'), { recursive: true });
    await writeFile(join(tempDirectory, 'data', 'raw', 'broken.json'), '{');
    const reader = new SourceDataReader();

    await expect(reader.readRequiredJson('broken.json')).rejects.toBeInstanceOf(
      InvalidJsonSourceError,
    );
  });
});
