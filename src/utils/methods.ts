import * as path from 'path';
import * as fs from 'fs'
import { encoding_for_model } from '@dqbd/tiktoken';

export function ensureUploadsFolder() {
    // 🔥 CHANGE: Leapcell ke liye /tmp folder use karo
    // Production (Leapcell): /tmp/uploads
    // Local development: ./uploads
    const uploadsPath = process.env.NODE_ENV === 'production' 
        ? '/tmp/uploads'  // Leapcell serverless environment
        : path.join(process.cwd(), 'uploads');  // Local development
    
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log(`📁 Uploads folder created at: ${uploadsPath}`);
    }
    
    return uploadsPath;
}

export function countTokens(text:string, model='tts-1') {
    const encoding = encoding_for_model('gpt-3.5-turbo'); // tts-1 uses the same tokenizer as gpt-3.5-turbo
    const tokens = encoding.encode(text);
    encoding.free(); // free memory
    return tokens.length;
}