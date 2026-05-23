import { plainToInstance, Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @Transform(({ value }) => Number(value ?? 3000))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsOptional()
  @IsString()
  DATABASE_FILE_PATH = 'data/kudwa-ledger.sqlite';

  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL = 'gemini-2.5-flash';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
