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
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.matchesService.findUpcoming();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Param('id') id: string, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }
}
