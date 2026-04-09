import { Controller, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('images')
  listImages(@Query('folder') folder = 'uploads') {
    return this.uploadService.listImages(folder);
  }
}
