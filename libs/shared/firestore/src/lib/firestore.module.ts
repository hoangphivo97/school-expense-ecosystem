import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({
  providers: [
    {
      provide: 'FIRESTORE_INSTANCE',
      useFactory: () => {
        if (admin.apps.length === 0) {
          const projectId = process.env['FIREBASE_PROJECT_ID'];
          const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
          const privateKey = process.env['FIREBASE_PRIVATE_KEY'];

          if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
              }),
            });
          } else {
            // Automatically authenticates via Google Cloud runtime service account
            admin.initializeApp();
          }
        }
        const firestore = admin.firestore();
        firestore.settings({ ignoreUndefinedProperties: true })
        return firestore;
      },
    },
  ],
  exports: ['FIRESTORE_INSTANCE'],
})
export class FirestoreModule { }