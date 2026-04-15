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
import { AddLineupDto } from './dto/add-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';
import { MatchLineupsService } from './match-lineups.service';

@Controller('match-lineups')
export class MatchLineupsController {
  constructor(private readonly matchLineupsService: MatchLineupsService) {}

  @Get()
  findAll() {
    return this.matchLineupsService.findAll();
  }

  @Get(':matchId')
  findByMatch(@Param('matchId') matchId: string) {
    return this.matchLineupsService.findByMatch(matchId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  add(@Body() dto: AddLineupDto) {
    return this.matchLineupsService.add(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Param('id') id: string, @Body() dto: UpdateLineupDto) {
    return this.matchLineupsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.matchLineupsService.remove(id);
  }
}
