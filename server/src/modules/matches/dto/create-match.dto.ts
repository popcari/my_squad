import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MatchStatus } from '../types';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  opponent: string;

  @IsDateString()
  matchDate: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
