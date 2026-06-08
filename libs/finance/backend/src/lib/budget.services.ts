import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin'; 
import { CreateBudgetDto } from './budget/DTO/create-budget.dto';

@Injectable()
export class BudgetService {
  private get db() {
    return admin.firestore();
  }

  /**
   * List of Budget
   */
  async findAll() {
    const snapshot = await this.db.collection('budgets').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Create Budget and audit log
   */
  async create(createBudgetDto: CreateBudgetDto, userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Security Exception: Invalid context identifier.');
    }

    const budgetPayload = {
      ...createBudgetDto,
      createdBy: userId,
      createdAt: admin.firestore.Timestamp.now(),
      remainingBudget: createBudgetDto.totalBudgetCeiling,
      fiscalYear: new Date().getFullYear(),
    };

    const docRef = await this.db.collection('budgets').add(budgetPayload);
    return { id: docRef.id, ...budgetPayload };
  }
}