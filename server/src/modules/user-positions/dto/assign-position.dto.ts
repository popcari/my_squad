import { IsNotEmpty, IsString } from 'class-validator';

export class AssignPositionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  positionId: string;
}
