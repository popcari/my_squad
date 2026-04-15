import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Request } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from './email.service';

type AuthedRequest = Request & { user?: { id: string; role?: string } };

/**
 * Pseudo-random password with at least 1 uppercase + 1 digit, drawn from a
 * pool that excludes ambiguous characters (0/O, 1/l/I) so it's safe to type
 * from an email.
 */
function generateTempPassword(length = 10): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const pool = upper + lower + digits;

  const chars = [
    upper[randomInt(0, upper.length)],
    digits[randomInt(0, digits.length)],
  ];
  for (let i = chars.length; i < length; i++) {
    chars.push(pool[randomInt(0, pool.length)]);
  }
  // Fisher–Yates shuffle so the guaranteed upper+digit aren't always at the
  // front of the string.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _, ...result } = user;
    return result;
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const { password: _, ...result } = user;
    return result;
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = await this.usersService.findOne(req.user.id);
    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.update(req.user.id, {
      password: hashed,
    } as unknown as UpdateUserDto);
    return { ok: true };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Always return success — don't leak whether the email is registered.
    if (!user) {
      return { ok: true };
    }

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    await this.usersService.update(user.id, {
      password: hashed,
    } as unknown as UpdateUserDto);

    await this.emailService.sendPasswordReset({
      to: user.email,
      name: user.displayName,
      tempPassword,
    });
    return { ok: true };
  }
}
