import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10);
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only PDF files are allowed'), { status: 400 }));
  }
};

export const uploadPDF = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter,
}).single('pdf');
