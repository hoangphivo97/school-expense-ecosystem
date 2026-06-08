import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as admin from 'firebase-admin';
import { UserInDb } from '../lib/interface/user-db.interface';

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
    return this.jwtService.sign({
      uid: user.uid,
      email: user.email,
      username: user.username,
      role: user.role,
      facultyId: user.facultyId,
      userType: user.userType
    });
  }

  async validateUser(username: string, password: string): Promise<UserInDb> {
    const snapshot = await this.db.collection('users').where('username', '==', username).limit(1).get();

    if (snapshot.empty) {
      throw new BadRequestException('User not found');
    }

    const user = snapshot.docs[0].data() as UserInDb;

    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return user;
  }

  // Issue JWT token for the user after successful login
  async login(user: UserInDb): Promise<{ access_token: string }> {
    return {
      access_token: this.generateJWT(user),
    };
  }
}
