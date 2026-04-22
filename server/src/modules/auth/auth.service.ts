import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../users/types';

interface TokenSubject {
  id: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(user: TokenSubject): string {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }
}
