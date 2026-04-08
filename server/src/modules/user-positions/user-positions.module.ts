import { Module } from '@nestjs/common';
import { UserPositionsController } from './user-positions.controller';
import { UserPositionsService } from './user-positions.service';

@Module({
  controllers: [UserPositionsController],
  providers: [UserPositionsService],
  exports: [UserPositionsService],
})
export class UserPositionsModule {}
