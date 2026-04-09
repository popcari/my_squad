import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';
import { UpdateTeamSettingsDto } from './dto/update-team-settings.dto';
import { TeamSettingsService } from './team-settings.service';

@Controller('team-settings')
export class TeamSettingsController {
  constructor(private readonly teamSettingsService: TeamSettingsService) {}

  @Get()
  async get() {
    const [settings, playerCount] = await Promise.all([
      this.teamSettingsService.get(),
      this.teamSettingsService.getPlayerCount(),
    ]);
    return { ...settings, playerCount };
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Body() dto: UpdateTeamSettingsDto) {
    return this.teamSettingsService.update(dto);
  }
}
