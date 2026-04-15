import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class UpdateTeamUniformDto {
  @IsInt()
  @Min(1900)
  @Max(3000)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'numberColor must be a hex color' })
  @IsOptional()
  numberColor?: string;

  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'shirtColor must be a hex color' })
  @IsOptional()
  shirtColor?: string;

  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'pantColor must be a hex color' })
  @IsOptional()
  pantColor?: string;
}
