import { GenerateJoinCodePayload, JoinProjectByCodePayload } from '@school-expense-ecosystem/projects/types';
import { ArrayMinSize, IsArray, IsDateString, IsISO8601, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class GenerateProjectJoinCodeDto implements GenerateJoinCodePayload {
  @IsNumber()
  @Min(1)
  maxUses!: number;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  expiresAt!: string;
}

export class JoinProjectByCodeDto implements JoinProjectByCodePayload {
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class AddStudentsToProjectDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one student ID must be provided' })
  studentIds!: string[];
}