import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MinLength(5, { message: 'Reason must be at least 5 characters long' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason?: string;
}