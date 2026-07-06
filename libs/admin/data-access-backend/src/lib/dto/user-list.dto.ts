import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf, IsDateString, Equals } from "class-validator";
import { FacultyId, Role, UserStatus, UserType } from "@school-expense-ecosystem/shared/types";
import { CreateUserInput, DeleteReasonType, UpdateUserInput } from "@school-expense-ecosystem/admin/types";

export class CreateUserDto implements CreateUserInput {
  @IsNotEmpty({ message: 'Institutional email address is mandatory.' })
  @IsEmail({}, { message: 'Invalid email address format.' })
  email!: string;

  @IsNotEmpty({ message: 'Functional role must be assigned.' })
  @IsEnum(Role, { message: 'Assigned role does not exist within the system matrix.' })
  role!: Role;

  @ValidateIf(o => o.role !== Role.LEVEL_0_ADMIN && o.role !== Role.LEVEL_1_FINANCE)
  @IsNotEmpty({ message: 'Personnel classification is required for academic roles.' })
  @IsEnum(UserType, { message: 'Invalid user type classification.' })
  userType?: UserType;

  @IsNotEmpty({ message: 'Institutional identifier code (userCode) cannot be empty.' })
  @IsString()
  userCode!: string;

  @IsNotEmpty({ message: 'Full legal name is strictly required for all directory entries.' })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long.' })
  fullName!: string;

  @ValidateIf((o: CreateUserDto) => o.role === Role.LEVEL_0_ADMIN)
  @IsNotEmpty({ message: 'Initial password configuration is mandatory for internal Admin accounts.' })
  @IsString()
  @MinLength(6, { message: 'System Admin password must be at least 6 characters long.' })
  password?: string;

  @ValidateIf(o => o.role === Role.LEVEL_2_DEAN || (o.role === Role.LEVEL_3_USER && o.userType !== UserType.STAFF))
  @IsNotEmpty({ message: 'Faculty isolation scope assignment is required for this profile context.' })
  @IsString()
  facultyId?: FacultyId;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO date string' })
  dateOfBirth?: string;
}

export class UpdateUserDto implements UpdateUserInput {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Updated name must be at least 2 characters.' })
  fullName?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Target role mutation out of system boundaries.' })
  role?: Role;

  @IsOptional()
  @IsEnum(UserType, { message: 'Target classification mutation out of system boundaries.' })
  userType?: UserType;

  @IsOptional()
  @IsNotEmpty({ message: 'Faculty isolation node cannot be updated to an empty string.' })
  @IsEnum(FacultyId, { message: 'Target facaulty mutation out of system boundaries.' })
  facultyId?: FacultyId;

  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO date string' })
  dateOfBirth?: string;
}

export class ChangeUserStatusDto {
  @IsNotEmpty({ message: 'Operational status target cannot be empty.' })
  @IsEnum(UserStatus, { message: 'Invalid operational status target.' })
  status!: UserStatus;

  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Justification reason must be at least 4 characters long.' })
  reason?: string;
}

export class DeleteUserDto {
  @IsNotEmpty({ message: 'Delete reason type is required.' })
  @IsEnum(DeleteReasonType, { message: 'Invalid delete reason classification.' })
  reasonType!: DeleteReasonType;

  @ValidateIf(o => o.reasonType === DeleteReasonType.INPUT_ERROR)
  @IsNotEmpty({ message: 'Confirmation text is mandatory for input error deletions.' })
  @IsString()
  @Equals('DELETE', { message: 'Confirmation text must be exactly "DELETE".' })
  confirmationText?: string;
}