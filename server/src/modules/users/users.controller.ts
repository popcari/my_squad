import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles, RolesGuard } from '../../common';
import { MatchGoalsService } from '../match-goals/match-goals.service';
import { UploadService } from '../upload/upload.service';
import { UserPositionsService } from '../user-positions/user-positions.service';
import { UserTraitsService } from '../user-traits/user-traits.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userPositionsService: UserPositionsService,
    private readonly userTraitsService: UserTraitsService,
    private readonly matchGoalsService: MatchGoalsService,
    private readonly uploadService: UploadService,
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user?: { id: string; role: string } },
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const requesterId = req.user?.id;
    if (requesterId && requesterId !== id) {
      throw new ForbiddenException('You can only upload your own avatar');
    }

    const { url } = await this.uploadService.upload(file, 'avatars');
    return this.usersService.update(id, { avatar: url });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PRESIDENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
