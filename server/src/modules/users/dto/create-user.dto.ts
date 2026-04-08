import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { UserRole } from '../types';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  jerseyNumber?: number;

  @IsString()
  @IsOptional()
  avatar?: string;
}
