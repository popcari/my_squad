import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class AssignTraitDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  traitId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  rating: number;
}
