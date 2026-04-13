import { Module } from '@nestjs/common';
import { TeamUniformsController } from './team-uniforms.controller';
import { TeamUniformsService } from './team-uniforms.service';

@Module({
  controllers: [TeamUniformsController],
  providers: [TeamUniformsService],
  exports: [TeamUniformsService],
})
export class TeamUniformsModule {}
