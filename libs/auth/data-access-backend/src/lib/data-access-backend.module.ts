import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthUserRepository } from './auth-user.repository';
import { FirebaseAuthRepository } from './infrastructure/firebase-auth.repository';
import { FirebaseIdentityProvider } from './infrastructure/firebase-identity.provider';
import { IdentityProvider } from './interface/identify-provider.interface';

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
