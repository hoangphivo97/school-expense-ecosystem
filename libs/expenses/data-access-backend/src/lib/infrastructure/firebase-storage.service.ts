// firebase-storage.service.ts
import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../storage-provider';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as admin from 'firebase-admin'; // Ensure firebase-admin is installed via npm

@Injectable()
export class FirebaseStorageAdapter implements StorageProvider {
    private get bucket() {
        // Retrieve the default authenticated Firebase Storage bucket instance
        const bucketName = process.env['FIREBASE_SDK_STORAGE_BUCKET'];
        return admin.storage().bucket(bucketName);
    }

    async uploadTemp(file: Express.Multer.File): Promise<string> {
        const fileName = `temp/${randomUUID()}${path.extname(file.originalname)}`;
        const blob = this.bucket.file(fileName);

        // Upload the raw buffer stream directly to the Firebase temporary directory boundary
        await blob.save(file.buffer, {
            contentType: file.mimetype,
            metadata: { cacheControl: 'public, max-age=31536000' }
        });

        // Generate a far-future signed URL so the frontend can securely preview the document instantly
        const [url] = await blob.getSignedUrl({
            action: 'read',
            expires: '01-01-2500'
        });

        return url;
    }

    async commitFiles(tempUrls: string[], expenseId: string): Promise<string[]> {
        const finalUrls: string[] = [];

        for (const url of tempUrls) {
            try {
                // Extract and decode the storage relative path segments from the public signed cloud URL
                const urlObj = new URL(url);
                const decodedPath = decodeURIComponent(urlObj.pathname);
                const segments = decodedPath.split('/');
                const tempIndex = segments.indexOf('temp');

                if (tempIndex === -1) {
                    finalUrls.push(url);
                    continue;
                }

                const fileName = segments.slice(tempIndex + 1).join('/');
                const sourcePath = `temp/${fileName}`;
                const targetPath = `uploaded/${expenseId}/${fileName}`;

                const sourceBlob = this.bucket.file(sourcePath);
                const targetBlob = this.bucket.file(targetPath);

                // Move the file from temp to the permanent folder layout inside Firebase Storage
                await sourceBlob.move(targetBlob);

                const [finalUrl] = await targetBlob.getSignedUrl({
                    action: 'read',
                    expires: '01-01-2500'
                });

                finalUrls.push(finalUrl);
            } catch (error) {
                // Fallback: if the cloud move execution fails, retain the original URL to guarantee application stability
                finalUrls.push(url);
            }
        }
        return finalUrls;
    }
}