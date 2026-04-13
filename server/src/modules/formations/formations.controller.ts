import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';
import { CreateFormationDto, UpdateFormationDto } from './dto';
import { FormationsService } from './formations.service';

@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  findAll() {
    return this.formationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formationsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  create(@Body() dto: CreateFormationDto) {
    return this.formationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Param('id') id: string, @Body() dto: UpdateFormationDto) {
    return this.formationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.formationsService.remove(id);
  }
}
