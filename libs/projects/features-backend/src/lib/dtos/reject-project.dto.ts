import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}