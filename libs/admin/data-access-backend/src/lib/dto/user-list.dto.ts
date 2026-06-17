import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { FacultyId, Role, UserStatus, UserType } from "@school-expense-ecosystem/auth/types";
import { CreateUserInput, UpdateUserInput } from "@school-expense-ecosystem/admin/types";

export class CreateUserDto implements CreateUserInput {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  userCode!: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role!: Role;

  @IsNotEmpty()
  @IsEnum(UserType)
  userType!: UserType;

  @IsOptional()
  @IsString()
  facultyId?: FacultyId;
}

export class UpdateUserDto implements UpdateUserInput {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsEnum(UserType)
  userType!: UserType;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  facultyId?: FacultyId;
}