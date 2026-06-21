import { Injectable } from '@nestjs/common';
import { IAdminAuditLogRepository } from '../repository/audit-log.repository';
import { IAuditLogInput } from '@school-expense-ecosystem/admin/types';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreAuditLogRepository implements IAdminAuditLogRepository {
  private readonly db = admin.firestore();
  private readonly collectionName = 'audit_logs';
  private readonly TTL_DAYS_DURATION = 90; // Retain logs strictly for 90 days before automated deletion

  async saveAdminActivityLog(logInput: IAuditLogInput): Promise<void> {
    const logCollectionRef = this.db.collection(this.collectionName);
    
    // 1. Calculate the precise future date object required by the Firestore TTL Engine
    const expirationTargetDate = new Date();
    expirationTargetDate.setDate(expirationTargetDate.getDate() + this.TTL_DAYS_DURATION);

    // 2. Build the optimized infrastructure payload mapping
    const structuredLogDocument = {
      actorUid: logInput.actorUid,
      actorEmail: logInput.actorEmail,
      action: logInput.action,
      targetIds: logInput.targetIds, // Preserves bulk arrays or single target IDs uniformly
      ...(logInput.changes ? { changes: logInput.changes } : {}), // Omit completely if no diff exists
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Hard server-driven tracking clock
      expireAt: admin.firestore.Timestamp.fromDate(expirationTargetDate) // 🌟 Direct hook target for Firestore TTL
    };

    // 3. Execute atomic fire-and-forget write operation into the root collection
    await logCollectionRef.add(structuredLogDocument);
  }
}