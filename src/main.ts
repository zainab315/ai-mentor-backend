import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, raw, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ ULTIMATE CORS FIX - Allow all origins for Vercel frontend
  app.enableCors({
    origin: true,  // Dynamically allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Apollo-Require-Preflight'],
  });
  
  app.use('/subscription/webhook', raw({ type: 'application/json' }));
  app.use(json());
  app.use(urlencoded({ extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Server running on port ${port}`);
  console.log(`✅ CORS enabled for all origins`);
  console.log(`📡 GraphQL endpoint available at /graphql`);
}

bootstrap();