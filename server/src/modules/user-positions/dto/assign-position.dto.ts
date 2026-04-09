import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AssignPositionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  positionId: string;

  @IsString()
  @IsIn(['primary', 'sub'])
  type: 'primary' | 'sub';
}
