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
import { UserTraitsService } from './user-traits.service';
import { AssignTraitDto } from './dto/assign-trait.dto';
import { UpdateTraitRatingDto } from './dto/update-trait-rating.dto';
import { Roles, RolesGuard } from '../../common';
import { UserRole } from '../users/types';

@Controller('user-traits')
export class UserTraitsController {
  constructor(private readonly userTraitsService: UserTraitsService) {}

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.userTraitsService.findByUser(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  assign(@Body() dto: AssignTraitDto) {
    return this.userTraitsService.assign(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  updateRating(@Param('id') id: string, @Body() dto: UpdateTraitRatingDto) {
    return this.userTraitsService.updateRating(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.PRESIDENT)
  remove(@Param('id') id: string) {
    return this.userTraitsService.remove(id);
  }
}
