import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseAuthRepository } from './infrastructure/firebase-auth.repository';
import { FirebaseIdentityProvider } from './infrastructure/firebase-identity.provider';
import { AuthService } from './services/auth.service';
import { AuthUserRepository } from './infrastructure/auth-user.repository';
import { IdentityProvider } from '@school-expense-ecosystem/auth/types';

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
  providers: [AuthService,
    JwtStrategy,
    {
      provide: AuthUserRepository,
      useClass: FirebaseAuthRepository
    },
    {
      provide: IdentityProvider,
      useClass: FirebaseIdentityProvider
    }
  ],
  exports: [AuthService,
    PassportModule,
    JwtModule
  ],
})
export class AuthDataAccessBackendModule { }
