import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { RateLimitExceededException } from '@school-expense-ecosystem/auth/data-access-backend';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected override async throwThrottlingException(
    ): Promise<void> {
        throw new RateLimitExceededException();
    }
}