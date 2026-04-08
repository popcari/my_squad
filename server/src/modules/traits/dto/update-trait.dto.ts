import { IsOptional, IsString } from 'class-validator';

export class UpdateTraitDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
