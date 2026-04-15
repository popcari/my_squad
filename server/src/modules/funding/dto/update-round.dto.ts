import { IsOptional, IsString } from 'class-validator';

export class UpdateRoundDto {
  @IsString()
  @IsOptional()
  name?: string;
}
