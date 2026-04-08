import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MatchStatus } from '../types';

export class UpdateMatchDto {
  @IsString()
  @IsOptional()
  opponent?: string;

  @IsDateString()
  @IsOptional()
  matchDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  homeScore?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  awayScore?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
