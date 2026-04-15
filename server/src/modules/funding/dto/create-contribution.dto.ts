import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ContributionType } from '../types';

export class CreateContributionDto {
  @IsString()
  @IsNotEmpty()
  roundId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(ContributionType)
  type: ContributionType;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  date: string;
}
