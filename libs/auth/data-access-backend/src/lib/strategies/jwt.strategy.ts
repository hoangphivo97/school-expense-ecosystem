import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env['JWT_SECRET'] || 'secretKey',
        });
    }

    async validate(payload: any) {
        const user = await this.authService.findByUid(payload.uid);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials or account not found.');
        }

        if(user.status === UserStatus.SUSPENDED){
            throw new UnauthorizedException('This account has been suspended. Please contact the administrator.');
        }

        return user;
    }
}