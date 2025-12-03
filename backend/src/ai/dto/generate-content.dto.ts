import { IsString, MinLength, MaxLength } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic: string;
}

