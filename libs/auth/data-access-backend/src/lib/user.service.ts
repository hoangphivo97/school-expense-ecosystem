import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { UserInDb } from '../lib/interface/user-db.interface';
import { OnboardingDto } from './DTO/onboarding.dto';
import { Role, UserStatus } from '@school-expense-ecosystem/auth/types';

@Injectable()
export class UserService implements OnModuleInit {
  private db!: admin.firestore.Firestore;

  constructor(private jwtService: JwtService) { }

  onModuleInit() {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env['FIREBASE_PROJECT_ID'],
          clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
          privateKey: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
        }),
      });
    }
    this.db = admin.firestore();
  }

  async findByUid(uid: string): Promise<UserInDb | null> {
    const doc = await this.db.collection('users').doc(uid).get();

    return doc.exists ? (doc.data() as UserInDb) : null;
  }

  async createUser(userData: UserInDb) {
    await this.db.collection('users').doc(userData.uid).set(userData);
    return userData;
  }

  generateJWT(user: UserInDb): string {
    const payload: UserInDb = {
      uid: user.uid,
      email: user.email,
      username: user.username,
      role: user.role,
      facultyId: user.facultyId,
      userType: user.userType,
      status: user.status,
      fullName: user.fullName,
      createdAt: user.createdAt
    }
    return this.jwtService.sign(payload);
  }

  async handleFirebaseLogin(token: string): Promise<{ token: string; user: UserInDb }> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email, name } = decodedToken;

      const userEmail = email ?? `no-email-${uid}@example.com`;

      let user = await this.findByUid(uid);

      if (!user) {
        user = await this.createUser({
          uid,
          email: userEmail,
          username: name ?? 'Unknown User',
          role: Role.LEVEL_3_USER,
          status: UserStatus.ONBOARDING
        });
      }

      const authToken = this.generateJWT(user);

      return { token: authToken, user };
    } catch (error) {
      throw new UnauthorizedException('Fail to verify your account or session token expired');
    }
  }

  async completeOnboarding(uid: string, dto: OnboardingDto): Promise<UserInDb> {
    const user = await this.findByUid(uid);
    if (!user) {
      throw new NotFoundException('User profile not found in database.');
    }

    const updatedData: Partial<UserInDb> = {
      fullName: dto.fullName,
      facultyId: dto.facultyId,
      userType: dto.userType,
      userCode: dto.userCode,
      dateOfBirth: dto.dateOfBirth,
      status: UserStatus.PENDING || user.status
    };

    await this.db.collection('users').doc(uid).update(updatedData);

    return { ...user, ...updatedData };
  }
}

