import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../types';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  jerseyNumber?: number;

  @IsString()
  @IsOptional()
  avatar?: string;
}
