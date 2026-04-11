import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { Contribution, Expense, FundingRound } from './types';

@Injectable()
export class FundingService {
  private readonly roundsCol;
  private readonly contributionsCol;
  private readonly expensesCol;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.roundsCol = this.firestore.collection('funding-rounds');
    this.contributionsCol = this.firestore.collection('contributions');
    this.expensesCol = this.firestore.collection('expenses');
  }

  // ─── ROUNDS ─────────────────────────────────────────────

  async findAllRounds(): Promise<FundingRound[]> {
    const snapshot = await this.roundsCol
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<FundingRound>(doc));
  }

  async createRound(dto: CreateRoundDto): Promise<FundingRound> {
    const now = new Date();
    const data = {
      name: dto.name,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.roundsCol.add(data);
    return { id: docRef.id, ...data } as FundingRound;
  }

  async updateRound(
    id: string,
    dto: UpdateRoundDto,
  ): Promise<FundingRound> {
    const docRef = this.roundsCol.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Round with id "${id}" not found`);
    }
    await docRef.update({ ...dto, updatedAt: new Date() });
    const updated = await docRef.get();
    return mapFirestoreDoc<FundingRound>(updated);
  }

  async removeRound(id: string): Promise<void> {
    const docRef = this.roundsCol.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Round with id "${id}" not found`);
    }
    // Cascade delete: remove all contributions in this round
    const contribs = await this.contributionsCol
      .where('roundId', '==', id)
      .get();
    await Promise.all(contribs.docs.map((d) => d.ref.delete()));
    await docRef.delete();
  }

  // ─── CONTRIBUTIONS ────────────────────────────────────────

  async findContributions(roundId?: string): Promise<Contribution[]> {
    if (roundId) {
      const snapshot = await this.contributionsCol
        .where('roundId', '==', roundId)
        .orderBy('date', 'desc')
        .get();
      return snapshot.docs.map((doc) => mapFirestoreDoc<Contribution>(doc));
    }
    const snapshot = await this.contributionsCol
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<Contribution>(doc));
  }

  async createContribution(
    dto: CreateContributionDto,
  ): Promise<Contribution> {
    const now = new Date();
    const data = {
      roundId: dto.roundId,
      userId: dto.userId,
      amount: dto.amount,
      type: dto.type,
      note: dto.note,
      date: new Date(dto.date),
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.contributionsCol.add(data);
    return { id: docRef.id, ...data } as Contribution;
  }

  async removeContribution(id: string): Promise<void> {
    const docRef = this.contributionsCol.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(
        `Contribution with id "${id}" not found`,
      );
    }
    await docRef.delete();
  }

  // ─── EXPENSES ─────────────────────────────────────────────

  async findAllExpenses(): Promise<Expense[]> {
    const snapshot = await this.expensesCol
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<Expense>(doc));
  }

  async createExpense(dto: CreateExpenseDto): Promise<Expense> {
    const now = new Date();
    const data = {
      description: dto.description,
      amount: dto.amount,
      date: new Date(dto.date),
      matchId: dto.matchId,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.expensesCol.add(data);
    return { id: docRef.id, ...data } as Expense;
  }

  async updateExpense(
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const docRef = this.expensesCol.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Expense with id "${id}" not found`);
    }
    const updateData: Record<string, unknown> = {
      ...dto,
      updatedAt: new Date(),
    };
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }
    await docRef.update(
      updateData as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>,
    );
    const updated = await docRef.get();
    return mapFirestoreDoc<Expense>(updated);
  }

  async removeExpense(id: string): Promise<void> {
    const docRef = this.expensesCol.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Expense with id "${id}" not found`);
    }
    await docRef.delete();
  }

  // ─── SUMMARY ──────────────────────────────────────────────

  async getSummary(): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }> {
    const [contribSnap, expenseSnap] = await Promise.all([
      this.contributionsCol.get(),
      this.expensesCol.get(),
    ]);

    const totalIncome = contribSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0,
    );
    const totalExpense = expenseSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0,
    );

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
