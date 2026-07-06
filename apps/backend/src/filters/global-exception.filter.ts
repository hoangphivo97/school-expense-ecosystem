import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BaseAuthException } from '@school-expense-ecosystem/auth/data-access-backend';
import { ErrorResponse, RestrictedAccountError } from '@school-expense-ecosystem/shared/types';
import { BaseAdminException } from '@school-expense-ecosystem/admin/data-access-backend';

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

        if (exception instanceof BaseAdminException) {
            const httpStatus = this.mapAdminCodeToHttpStatus(exception.errorCode);
            return response.status(httpStatus).json({
                statusCode: httpStatus,
                errorCode: exception.errorCode,
                errorMsg: exception.message,
                ...exception.extraData
            });
        }

        console.error('Unhandled Critical System Crash:', exception);

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            errorCode: 'INTERNAL_SERVER_ERROR',
            errorMsg: 'An unexpected infrastructural error occurred on the server.'
        });

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

    private mapAdminCodeToHttpStatus(errorCode: string): HttpStatus {
        switch (errorCode) {
            case 'ADMIN_USER_NOT_FOUND':
                return HttpStatus.NOT_FOUND; // 404
            case 'ADMIN_SELF_MUTATION_VIOLATION':
            case 'ADMIN_PEER_PROTECTION_VIOLATION':
                return HttpStatus.FORBIDDEN; // 403
            case 'ADMIN_IDENTITY_CONFLICT':
                return HttpStatus.CONFLICT; // 409
            case 'ADMIN_INVALID_DELETION_STATUS':
            case 'ADMIN_SECURITY_THREAT_RESTRICTION':
                return HttpStatus.BAD_REQUEST; // 400
            default:
                return HttpStatus.BAD_REQUEST;
        }
    }
}