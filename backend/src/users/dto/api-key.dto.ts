import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ApiKeyType {
  GOOGLE_GEMINI = 'google_gemini',
  OPENAI = 'openai',
  HUGGINGFACE = 'huggingface',
}

export class SaveApiKeyDto {
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @IsString()
  apiKey: string;
}

export class VerifyApiKeyDto {
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @IsString()
  apiKey: string;
}

export class TestModelDto {
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @IsString()
  model: string;
}

export class SaveSelectedModelDto {
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @IsString()
  model: string;
}

