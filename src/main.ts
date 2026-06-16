import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, raw, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🌟 ULTIMATE CORS FIX - Manual Headers (Railway edge bypass)
  app.use((req, res, next) => {
    // Allow from anywhere (temporary for FYP)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, Apollo-Require-Preflight, Clerk-User-Id, Clerk-Session-Id');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight OPTIONS request immediately
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
  
  // Keep your existing body parsers
  app.use('/subscription/webhook', raw({ type: 'application/json' }));
  app.use(json());
  app.use(urlencoded({ extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Server running on port ${port}`);
  console.log(`✅ CORS manually enabled for all origins`);
}

bootstrap();