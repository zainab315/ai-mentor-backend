import * as path from 'path';
import * as fs from 'fs'
import { encoding_for_model } from '@dqbd/tiktoken';

export function ensureUploadsFolder() {
    const uploadsPath = path.join(process.cwd(), 'uploads'); // Ensure it's in the project root
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
  }




export function countTokens(text:string, model='tts-1') {
  const encoding = encoding_for_model('gpt-3.5-turbo'); // tts-1 uses the same tokenizer as gpt-3.5-turbo
  const tokens = encoding.encode(text);
  encoding.free(); // free memory
  return tokens.length;
}