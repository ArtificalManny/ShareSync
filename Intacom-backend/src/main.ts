import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express'; // Use default import for Express
import { Server } from 'socket.io';
import mongoose from 'mongoose'; // Use default import for Mongoose
import cookieParser from 'cookie-parser'; // Use default import for cookie-parser
import path from 'path';
import fs from 'fs';
import multer from 'multer'; // Use default import for multer

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Connect to MongoDB using Mongoose
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom';
  await mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

  // Socket.IO setup
  const server = app.getHttpServer();
  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust for your frontend URL in production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
  });

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage }).single('file');

  // Ensure uploads directory exists
  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
  }

  // Static files for uploads
  app.use('/uploads', express.static('uploads'));

  // Start the server
  await app.listen(3000, () => console.log(`Server running on port 3000`));
}
bootstrap();