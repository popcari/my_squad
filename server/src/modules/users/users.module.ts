import { Module } from '@nestjs/common';
import { MatchGoalsModule } from '../match-goals/match-goals.module';
import { UserPositionsModule } from '../user-positions/user-positions.module';
import { UserTraitsModule } from '../user-traits/user-traits.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UserPositionsModule, UserTraitsModule, MatchGoalsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
