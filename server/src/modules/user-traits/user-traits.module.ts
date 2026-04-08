import { Module } from '@nestjs/common';
import { UserTraitsController } from './user-traits.controller';
import { UserTraitsService } from './user-traits.service';

@Module({
  controllers: [UserTraitsController],
  providers: [UserTraitsService],
  exports: [UserTraitsService],
})
export class UserTraitsModule {}
