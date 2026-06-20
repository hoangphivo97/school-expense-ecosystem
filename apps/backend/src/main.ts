// apps/backend/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { onRequest } from 'firebase-functions/v2/https'; // 🔥 Dùng Gen 2 chạy trên Cloud Run
import express from 'express';
import { configure as serverlessExpress } from '@codegenie/serverless-express';

const expressApp = express();
let cachedServer: any;

function configureNestApp(app: any) {
  app.enableCors({
    origin: true,
    credentials: true
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
}

async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    configureNestApp(app);
    await app.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}


export const api = onRequest(
  {
    region: 'asia-east1',
    memory: '1GiB',
    minInstances: 1
  },
  async (req, res) => {
    const server = await bootstrapServer();
    if (server) {
      server(req, res);
    } else {
      res.status(500).send('Server initialization failed');
    }
  }
);

if (process.env.NODE_ENV === 'development' || !process.env.FUNCTIONS_EMULATOR) {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule);
    configureNestApp(app); 

    const port = process.env.PORT || 3000; 
    await app.listen(port);

    Logger.log(`🔥 [Enterprise] Pháo đài Backend đang mở cổng tại: http://localhost:${port}/api`);
  }

  bootstrapLocal();
}