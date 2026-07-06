import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '@school-expense-ecosystem/shared/types';
import { RateLimitExceededException } from '@school-expense-ecosystem/auth/data-access-backend';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected override async throwThrottlingException(
    ): Promise<void> {
        throw new RateLimitExceededException();
    }
}