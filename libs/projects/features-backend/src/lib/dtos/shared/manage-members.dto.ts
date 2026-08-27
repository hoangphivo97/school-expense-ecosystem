import { GenerateJoinCodePayload, JoinEntitytByCodePayload } from '@school-expense-ecosystem/projects/types';
import { ArrayMinSize, IsArray, IsISO8601, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class GenerateJoinCodeDto implements GenerateJoinCodePayload {
  @IsNumber()
  @Min(1)
  maxUses!: number;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  expiresAt!: string;
}

export class JoinByCodeDto implements JoinEntitytByCodePayload {
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class AddParticipantsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one user ID must be provided' })
  userIds!: string[];
}