import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './types';
import { UserPositionsService } from '../user-positions/user-positions.service';
import { UserTraitsService } from '../user-traits/user-traits.service';
import { MatchGoalsService } from '../match-goals/match-goals.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userPositionsService: UserPositionsService,
    private readonly userTraitsService: UserTraitsService,
    private readonly matchGoalsService: MatchGoalsService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('role/:role')
  findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    const [user, positions, traits, goals] = await Promise.all([
      this.usersService.findOne(id),
      this.userPositionsService.findByUser(id),
      this.userTraitsService.findByUser(id),
      this.matchGoalsService.findByScorer(id),
    ]);

    const assists = await this.matchGoalsService.findByAssist(id);

    return {
      ...user,
      positions,
      traits,
      stats: {
        goals: goals.length,
        assists: assists.length,
      },
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
