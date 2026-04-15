import { IsNumber, Max, Min } from 'class-validator';
import { IsHalfStep } from '../../../common';

export class UpdateTraitRatingDto {
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  @IsHalfStep()
  rating: number;
}
