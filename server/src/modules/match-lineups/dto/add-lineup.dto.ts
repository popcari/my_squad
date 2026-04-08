import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
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
}
