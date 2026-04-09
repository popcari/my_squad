import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { AddGoalDto } from './dto/add-goal.dto';
import { MatchGoal } from './types';

@Injectable()
export class MatchGoalsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('match_goals');
  }

  async findByMatch(matchId: string): Promise<MatchGoal[]> {
    const snapshot = await this.collection
      .where('matchId', '==', matchId)
      .get();
    return snapshot.docs
      .map((doc) => mapFirestoreDoc<MatchGoal>(doc))
      .sort((a, b) => a.minute - b.minute);
  }

  async findByScorer(userId: string): Promise<MatchGoal[]> {
    const snapshot = await this.collection
      .where('scorerId', '==', userId)
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<MatchGoal>(doc));
  }

  async findByAssist(userId: string): Promise<MatchGoal[]> {
    const snapshot = await this.collection
      .where('assistId', '==', userId)
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<MatchGoal>(doc));
  }

  async add(dto: AddGoalDto): Promise<MatchGoal> {
    const data = { ...dto, createdAt: new Date() };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data };
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Goal with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
