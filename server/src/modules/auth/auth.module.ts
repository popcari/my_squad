import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { EmailService } from './email.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [EmailService],
})
export class AuthModule {}
