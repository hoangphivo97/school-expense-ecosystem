// firebase-identity.provider.ts
import { Injectable } from '@nestjs/common';
import  { IdentityProvider, ExternalIdentityProfile } from '../interface/identify-provider.interface'
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseIdentityProvider implements IdentityProvider {
  async verifyToken(token: string): Promise<ExternalIdentityProfile> {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    const userRecord = await admin.auth().getUser(uid);
    const creationTime = userRecord.metadata.creationTime;
    
    const nativeDate = creationTime ? new Date(creationTime) : new Date();

    return {
      uid,
      email: email!,
      name,
      createdAt: nativeDate
    };
  }
}