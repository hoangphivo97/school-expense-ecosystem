import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email wrong format' })
  @IsNotEmpty({ message: 'Email can not empty' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'password cannot empty' })
  password!: string;
}
