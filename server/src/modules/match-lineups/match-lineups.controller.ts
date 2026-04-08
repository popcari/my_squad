import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MatchLineupsService } from './match-lineups.service';
import { AddLineupDto } from './dto/add-lineup.dto';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';

@Controller('match-lineups')
export class MatchLineupsController {
  constructor(private readonly matchLineupsService: MatchLineupsService) {}

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

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.matchLineupsService.remove(id);
  }
}
