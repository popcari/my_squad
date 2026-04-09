import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match, MatchStatus } from './types';

@Injectable()
export class MatchesService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('matches');
  }

  async findAll(): Promise<Match[]> {
    const snapshot = await this.collection.orderBy('matchDate', 'asc').get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<Match>(doc));
  }

  async findOne(id: string): Promise<Match> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Match with id "${id}" not found`);
    }
    return mapFirestoreDoc<Match>(doc);
  }

  async findByMonth(year: number, month: number): Promise<Match[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const snapshot = await this.collection
      .where('matchDate', '>=', start)
      .where('matchDate', '<', end)
      .orderBy('matchDate', 'asc')
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<Match>(doc));
  }

  async findUpcoming(): Promise<Match[]> {
    const snapshot = await this.collection
      .where('status', '==', MatchStatus.SCHEDULED)
      .get();
    const now = new Date();
    return snapshot.docs
      .map((doc) => mapFirestoreDoc<Match>(doc))
      .filter((m) => new Date(m.matchDate) >= now)
      .sort(
        (a, b) =>
          new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
      );
  }

  async create(dto: CreateMatchDto): Promise<Match> {
    const now = new Date();
    const data = {
      opponent: dto.opponent,
      matchDate: new Date(dto.matchDate),
      location: dto.location,
      status: dto.status ?? MatchStatus.SCHEDULED,
      homeScore: undefined,
      awayScore: undefined,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data } as Match;
  }

  async update(id: string, dto: UpdateMatchDto): Promise<Match> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Match with id "${id}" not found`);
    }

    const updateData: Record<string, unknown> = {
      ...dto,
      updatedAt: new Date(),
    };
    if (dto.matchDate) {
      updateData.matchDate = new Date(dto.matchDate);
    }

    await docRef.update(
      updateData as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>,
    );
    const updated = await docRef.get();
    return mapFirestoreDoc<Match>(updated);
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Match with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
