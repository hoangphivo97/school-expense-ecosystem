import { UserStatus } from "../enums/user.enum";

export interface ErrorResponse {
    statusCode: number;
    errorCode: string;
    errorMsg: string;
}

export interface RestrictedAccountError extends ErrorResponse {
  userStatus: UserStatus;
  reason: string;
}