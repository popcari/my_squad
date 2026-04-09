import { Controller, Delete, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('images')
  listImages(@Query('folder') folder = 'uploads') {
    return this.uploadService.listImages(folder);
  }

  @Delete('images')
  deleteImage(@Query('publicId') publicId: string) {
    return this.uploadService.deleteImage(publicId);
  }
}
