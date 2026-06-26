import { IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsEnum, IsDateString } from 'class-validator';
import { FacultyId, UserType } from '@school-expense-ecosystem/shared/types';

export class OnboardingDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\u4e00-\u9fff\s]*$/, {
    message: 'Full name can only contain English letters, unaccented Vietnamese, or Traditional Chinese characters and spaces.',
  })
  fullName!: string;

  @IsNotEmpty()
  @IsEnum(FacultyId, { message: 'Invalid faculty identifier.' })
  facultyId!: FacultyId;

  @IsNotEmpty()
  @IsEnum(UserType, { message: 'Invalid institutional user type.' })
  userType!: UserType;

  @IsNotEmpty()
  @IsString()
  userCode!: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'Date of birth must be a valid ISO date string.' })
  dateOfBirth!: string;
}