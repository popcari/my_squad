import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';
import { AddGoalDto } from './dto/add-goal.dto';
import { MatchGoalsService } from './match-goals.service';

@Controller('match-goals')
export class MatchGoalsController {
  constructor(private readonly matchGoalsService: MatchGoalsService) {}

  @Get()
  findAll() {
    return this.matchGoalsService.findAll();
  }

  @Get('match/:matchId')
  findByMatch(@Param('matchId') matchId: string) {
    return this.matchGoalsService.findByMatch(matchId);
  }

  @Get('scorer/:userId')
  findByScorer(@Param('userId') userId: string) {
    return this.matchGoalsService.findByScorer(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  add(@Body() dto: AddGoalDto) {
    return this.matchGoalsService.add(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.matchGoalsService.remove(id);
  }
}
