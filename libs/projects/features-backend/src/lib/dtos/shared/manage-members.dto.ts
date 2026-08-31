import { GenerateJoinCodePayload, JoinByCodePayload, ManageParticipantsPayload } from '@school-expense-ecosystem/projects/types';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class GenerateJoinCodeDto implements GenerateJoinCodePayload {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;
}

export class JoinByCodeDto implements JoinByCodePayload {
  @IsString()
  @IsNotEmpty()
  @Length(6, 10)
  code!: string;
}

export class AddParticipantsDto implements ManageParticipantsPayload{
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one user ID must be provided' })
  userIds!: string[];
}