// firebase-identity.provider.ts
import { Injectable } from '@nestjs/common';
import { IdentityProvider, ExternalIdentityProfile } from '@school-expense-ecosystem/backend/auth/data-access';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseIdentityProvider implements IdentityProvider {
  async verifyToken(token: string): Promise<ExternalIdentityProfile> {
    // 1. Xác thực ID Token từ client
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // 2. Mang nguyên vẹn logic lấy creationTime của bạn vào đây để cô lập hạ tầng
    const userRecord = await admin.auth().getUser(uid);
    const creationTime = userRecord.metadata.creationTime;
    
    // Đổi sang kiểu Date thuần của Javascript
    const nativeDate = creationTime ? new Date(creationTime) : new Date();

    return {
      uid,
      email: email!,
      name,
      createdAt: nativeDate // Trả về Date sạch lên tầng Service
    };
  }
}