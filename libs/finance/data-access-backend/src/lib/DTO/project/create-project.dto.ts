import { ProjectFundingType } from "@school-expense-ecosystem/finance/types";
import { FacultyId } from "@school-expense-ecosystem/shared/types";
import { IsString, IsNumber, IsPositive, IsEnum, IsOptional, Min, IsDateString, IsArray, ArrayMinSize } from "class-validator";

export class CreateProjectDto {
    @IsString()
    name!: string;

    @IsNumber()
    @IsPositive()
    budgetCap!: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    currentSpent?: number;

    @IsEnum(ProjectFundingType)
    @IsString()
    type!: ProjectFundingType;

    @IsString()
    mentorId!: string;

    @IsString()
    @IsEnum(FacultyId)
    facultyId!: FacultyId;

    @IsOptional()
    @IsString()
    deanId?: string;

    @IsNumber()
    @Min(1)
    maxUses!: number;

    @IsString()
    expiresAt!: Date;

    @IsDateString()
    startDate!: Date;

    @IsDateString()
    endDate!: Date;
}

export class AddStudentsToProjectDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1, { message: 'At least one student ID must be provided' })
    studentIds!: string[];
}

export class GenerateProjectJoinCodeDto {
    @IsNumber()
    @Min(1)
    maxUses!: number;

    @IsDateString()
    expiresAt!: Date;
}