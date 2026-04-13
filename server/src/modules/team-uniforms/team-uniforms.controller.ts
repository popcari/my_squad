import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';
import { CreateTeamUniformDto } from './dto/create-team-uniform.dto';
import { UpdateTeamUniformDto } from './dto/update-team-uniform.dto';
import { TeamUniformsService } from './team-uniforms.service';

@Controller('team-uniforms')
export class TeamUniformsController {
  constructor(private readonly teamUniformsService: TeamUniformsService) {}

  @Get()
  findAll(@Query('year') year?: string) {
    if (year !== undefined) {
      return this.teamUniformsService.findByYear(Number(year));
    }
    return this.teamUniformsService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  create(@Body() dto: CreateTeamUniformDto) {
    return this.teamUniformsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Param('id') id: string, @Body() dto: UpdateTeamUniformDto) {
    return this.teamUniformsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.teamUniformsService.remove(id);
  }
}
