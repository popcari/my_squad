import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTraitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
