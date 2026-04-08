import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserPositionsService } from './user-positions.service';
import { AssignPositionDto } from './dto/assign-position.dto';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';

@Controller('user-positions')
export class UserPositionsController {
  constructor(private readonly userPositionsService: UserPositionsService) {}

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.userPositionsService.findByUser(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  assign(@Body() dto: AssignPositionDto) {
    return this.userPositionsService.assign(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.userPositionsService.remove(id);
  }
}
