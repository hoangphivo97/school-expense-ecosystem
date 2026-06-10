import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as admin from 'firebase-admin';
import { UserInDb } from '../lib/interface/user-db.interface';
import { OnboardingDto } from './DTO/onboarding.dto';
import { UserStatus } from '@school-expense-ecosystem/auth/types';

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

  async validateUser(email: string, password: string): Promise<UserInDb> {
    const snapshot = await this.db.collection('users').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      throw new BadRequestException('Email or password incorrect');
    }

    const user = snapshot.docs[0].data() as UserInDb;

    // So sánh mật khẩu đã hash lưu trong Firestore với mật khẩu user nhập vào
    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    return user;
  }

  // Issue JWT token for the user after successful login
  async login(user: UserInDb): Promise<{ access_token: string }> {
    return {
      access_token: this.generateJWT(user),
    };
  }

  async completeOnboarding(uid: string, dto: OnboardingDto): Promise<UserInDb> {
    // 1. Kiểm tra User có tồn tại trong hệ thống hay không
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

