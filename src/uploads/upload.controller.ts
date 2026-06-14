import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// Simple interface instead of Express.Multer.File
interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('upload')
export class UploadController {
  
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: UploadedFileType) {
    // Snap bucket ke liye simple response
    return {
      success: true,
      message: 'Upload ready',
      fileInfo: {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    };
  }
}