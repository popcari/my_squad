import { IsInt, Max, Min } from 'class-validator';

export class UpdateTraitRatingDto {
  @IsInt()
  @Min(1)
  @Max(100)
  rating: number;
}
