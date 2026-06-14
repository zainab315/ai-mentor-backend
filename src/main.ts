 import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, raw, urlencoded } from 'express';
import { Module, OnModuleInit } from '@nestjs/common';

dotenv.config();

// Safe version - agar file missing hai toh error nahi aayega
let ensureUploadsFolder = () => {};
try {
  const methods = require('./utils/methods');
  ensureUploadsFolder = methods.ensureUploadsFolder || (() => {});
} catch(e) {
  console.log('⚠️ utils/methods not found, skipping ensureUploadsFolder');
}

async function bootstrap() {
  ensureUploadsFolder();
  const app = await NestFactory.create(AppModule);
  
  // ✅ UPDATED CORS CONFIGURATION (Frontend ke liye)
  app.enableCors({
    origin: [
      'http://localhost:3000',      // NextJS default
      'http://localhost:3001',      // Agar NextJS 3001 pe ho
      'http://127.0.0.1:3000',      // Localhost alternative
      'http://127.0.0.1:3001',      // Localhost alternative
      process.env.FRONTEND_URL,      // Production frontend URL (env mein daalna)
    ].filter(Boolean),               // Null/undefined values hatao
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });
  
  app.use('/subscription/webhook', raw({ type: 'application/json' }));

  // Regular body parser for other routes
  app.use(json());
  app.use(urlencoded({ extended: true }));

  // Render ke liye PORT environment variable
  const port = process.env.PORT || 3012;
  
  // '0.0.0.0' par listen karo (Render requirement)
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`✅ CORS enabled for: http://localhost:3000, http://localhost:3001`);
  console.log(`📡 GraphQL endpoint: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/graphql`);
}

bootstrap();