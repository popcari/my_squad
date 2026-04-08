import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AddGoalDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  scorerId: string;

  @IsString()
  @IsOptional()
  assistId?: string;

  @IsInt()
  @Min(1)
  @Max(120)
  minute: number;
}
