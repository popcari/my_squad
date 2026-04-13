import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class CreateTeamUniformDto {
  @IsInt()
  @Min(1900)
  @Max(3000)
  year: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(HEX_COLOR_REGEX, { message: 'numberColor must be a hex color' })
  numberColor: string;

  @IsString()
  @IsNotEmpty()
  @Matches(HEX_COLOR_REGEX, { message: 'shirtColor must be a hex color' })
  shirtColor: string;

  @IsString()
  @IsNotEmpty()
  @Matches(HEX_COLOR_REGEX, { message: 'pantColor must be a hex color' })
  pantColor: string;
}
