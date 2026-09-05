import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { onRequest } from 'firebase-functions/v2/https'; 
import { GlobalExceptionFilter } from './filters/global-exception.filter';

let cachedServer: any;

function configureNestApp(app: any) {
  app.enableCors({
    origin: true,
    credentials: true,
    maxAge: 86400,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalFilters(new GlobalExceptionFilter());

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
    const app = await NestFactory.create(AppModule);
    
    configureNestApp(app);
    await app.init();
    
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}


export const api = onRequest(
  {
    region: 'asia-east1',
    memory: '1GiB',
    minInstances: 0
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

if (process.env.NODE_ENV === 'development') {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule);
    configureNestApp(app); 

    const port = process.env.PORT || 3000; 
    await app.listen(port);

    Logger.log(`🔥 [Enterprise] Pháo đài Backend đang mở cổng tại: http://localhost:${port}/api`);
  }

  bootstrapLocal();
}