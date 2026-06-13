import { UserInDb } from './interface/user-db.interface';

export abstract class AuthUserRepository {
  abstract findByUid(uid: string): Promise<UserInDb | null>;
  abstract createUser(userData: UserInDb): Promise<UserInDb>;
  abstract updateUser(uid: string, updateData: Partial<UserInDb>): Promise<UserInDb>;
}