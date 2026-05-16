"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPDF = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10);
const UPLOAD_DIR = path_1.default.resolve(process.env.UPLOAD_DIR ?? './uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(Object.assign(new Error('Only PDF files are allowed'), { status: 400 }));
    }
};
exports.uploadPDF = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_MB * 1024 * 1024 },
    fileFilter,
}).single('pdf');
