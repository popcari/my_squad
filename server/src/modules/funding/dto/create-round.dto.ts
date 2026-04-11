import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoundDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
