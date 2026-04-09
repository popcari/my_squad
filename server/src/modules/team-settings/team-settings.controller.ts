import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';
import { UpdateTeamSettingsDto } from './dto/update-team-settings.dto';
import { TeamSettingsService } from './team-settings.service';

@Controller('team-settings')
export class TeamSettingsController {
  constructor(private readonly teamSettingsService: TeamSettingsService) {}

  @Get()
  get() {
    return this.teamSettingsService.getCached();
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  update(@Body() dto: UpdateTeamSettingsDto) {
    return this.teamSettingsService.update(dto);
  }
}
