import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BaseAuthException } from '@school-expense-ecosystem/auth/data-access-backend';
import { ErrorResponse, RestrictedAccountError } from '@school-expense-ecosystem/shared/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof BaseAuthException) {
            const httpStatus = this.mapAuthCodeToHttpStatus(exception.errorCode);

            const errorPayload: ErrorResponse = {
                statusCode: httpStatus,
                errorCode: exception.errorCode,
                errorMsg: exception.message
            }

            if (exception.errorCode === 'AUTH_ACCOUNT_RESTRICTED') {
                const restrictedPayload: RestrictedAccountError = {
                    ...errorPayload,
                    userStatus: exception.extraData?.['userStatus'],
                    reason: exception.extraData?.['reason']
                };
                return response.status(httpStatus).json(restrictedPayload);
            }

            return response.status(httpStatus).json(errorPayload);
        }

    }

    private mapAuthCodeToHttpStatus(errorCode: string): HttpStatus {
        switch (errorCode) {
            case 'AUTH_USER_NOT_FOUND':
                return HttpStatus.NOT_FOUND;
            case 'AUTH_INVALID_TOKEN':
                return HttpStatus.UNAUTHORIZED; // 401
            case 'AUTH_ACCOUNT_RESTRICTED':
                return HttpStatus.FORBIDDEN; // 403
            case 'AUTH_IDENTITY_CONFLICT_EMAIL':
            case 'AUTH_IDENTITY_CONFLICT_CLAIMED':
                return HttpStatus.CONFLICT; // 409
            default:
                return HttpStatus.BAD_REQUEST; // 400
        }
    }
}