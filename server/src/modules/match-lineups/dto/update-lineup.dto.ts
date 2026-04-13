import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { LineupType } from '../types';

export class UpdateLineupDto {
  @IsEnum(LineupType)
  @IsOptional()
  type?: LineupType;

  // Allow either a positive int slotIndex or explicit null (to clear it).
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  @Min(0)
  @IsOptional()
  slotIndex?: number | null;
}
