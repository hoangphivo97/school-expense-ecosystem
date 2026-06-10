import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt'
    }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UserService,
    JwtStrategy
  ],
  exports: [UserService,
    PassportModule,
    JwtModule
  ],
})
export class AuthDataAccessBackendModule { }
