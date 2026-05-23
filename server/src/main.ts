import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './infrastructure/config/app.config';
import { ApplicationExceptionFilter } from './infrastructure/http/application-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix(appConfig.globalPrefix);
  app.useGlobalFilters(new ApplicationExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(configService.getOrThrow<number>('PORT'));
}
void bootstrap();
