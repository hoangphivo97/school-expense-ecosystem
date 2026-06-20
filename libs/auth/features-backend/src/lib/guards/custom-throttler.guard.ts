import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected override async throwThrottlingException(
        context: ExecutionContext,
        throttlerLimitDetail: any
    ): Promise<void> {
        throw new HttpException(
            `Whoa, slow down turbo! You're clicking faster than a sweatlord in an RPG raid. Chill for a minute!`,
            HttpStatus.TOO_MANY_REQUESTS
        );
    }
}