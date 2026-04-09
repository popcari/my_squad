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
import { CreateTraitDto } from './dto/create-trait.dto';
import { UpdateTraitDto } from './dto/update-trait.dto';
import { TraitsService } from './traits.service';

@Controller('traits')
export class TraitsController {
  constructor(private readonly traitsService: TraitsService) {}

  @Get()
  findAll() {
    return this.traitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.traitsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  create(@Body() dto: CreateTraitDto) {
    return this.traitsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Param('id') id: string, @Body() dto: UpdateTraitDto) {
    return this.traitsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.traitsService.remove(id);
  }
}
