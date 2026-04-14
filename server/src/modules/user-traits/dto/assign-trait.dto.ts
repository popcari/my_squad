import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { IsHalfStep } from '../../../common';

export class AssignTraitDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  traitId: string;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  @IsHalfStep()
  rating: number;
}
