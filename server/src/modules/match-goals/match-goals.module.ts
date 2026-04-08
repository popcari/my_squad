import { Module } from '@nestjs/common';
import { MatchGoalsController } from './match-goals.controller';
import { MatchGoalsService } from './match-goals.service';

@Module({
  controllers: [MatchGoalsController],
  providers: [MatchGoalsService],
  exports: [MatchGoalsService],
})
export class MatchGoalsModule {}
