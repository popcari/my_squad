import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FormationSlotDto } from './create-formation.dto';

export class UpdateFormationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => FormationSlotDto)
  @IsOptional()
  slots?: FormationSlotDto[];
}
