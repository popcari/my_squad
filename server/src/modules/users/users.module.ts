import { Module } from '@nestjs/common';
import { MatchGoalsModule } from '../match-goals/match-goals.module';
import { UploadModule } from '../upload/upload.module';
import { UserPositionsModule } from '../user-positions/user-positions.module';
import { UserTraitsModule } from '../user-traits/user-traits.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UserPositionsModule, UserTraitsModule, MatchGoalsModule, UploadModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
