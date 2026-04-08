import { Module } from '@nestjs/common';
import { MatchLineupsController } from './match-lineups.controller';
import { MatchLineupsService } from './match-lineups.service';

@Module({
  controllers: [MatchLineupsController],
  providers: [MatchLineupsService],
  exports: [MatchLineupsService],
})
export class MatchLineupsModule {}
