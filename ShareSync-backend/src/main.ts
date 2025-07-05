// src/main.ts
import * as dotenv from 'dotenv/config'
import { join }            from 'path'
import { NestFactory }     from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule }       from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // serve ./uploads under http://localhost:3000/uploads/...
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  })

  app.enableCors({ origin: true, credentials: true })
  app.setGlobalPrefix('api')

  console.log('🟢 JWT_SECRET:', process.env.JWT_SECRET) // ✅ NOW CORRECTLY PLACED

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`🚀 Running on http://localhost:${port}`)
}
bootstrap()