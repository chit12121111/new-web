import { IsString, MinLength } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  @MinLength(1, { message: 'Prompt cannot be empty' })
  topic: string;
}

