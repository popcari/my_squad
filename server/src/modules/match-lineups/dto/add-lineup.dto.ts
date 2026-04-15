import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LineupType } from '../types';

export class AddLineupDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(LineupType)
  type: LineupType;

  @IsInt()
  @Min(0)
  @IsOptional()
  slotIndex?: number | null;
}
