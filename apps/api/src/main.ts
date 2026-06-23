import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './uploads/upload.config';

const DEV_JWT_SECRETS = ['praja-access-secret-dev', 'praja-refresh-secret-dev'];

function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const bad = required.filter((name) => {
    const value = process.env[name];
    return !value || DEV_JWT_SECRETS.includes(value);
  });
  if (bad.length > 0) {
    throw new Error(
      `Refusing to start in production: ${bad.join(', ')} must be set to a strong, non-default value.`,
    );
  }
}

async function bootstrap() {
  assertProductionSecrets();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  });

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  app.useStaticAssets(UPLOAD_DIR, { prefix: `${UPLOAD_URL_PREFIX}/` });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Praja Connect API running on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
