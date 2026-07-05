import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected override async throwThrottlingException(
    ): Promise<void> {
        throw new HttpException(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                errorCode: 'API_RATE_LIMIT_EXCEEDED',
                errorMsg: "Whoa, slow down turbo! You're clicking faster than a sweatlord in an RPG raid. Chill for a minute!",
            } as ErrorResponse,
            HttpStatus.TOO_MANY_REQUESTS
        );
    }
}