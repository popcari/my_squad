import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIRESTORE } from '../../config';
import { mapFirestoreDoc } from '../../common';
import { MatchLineup } from './types';
import { AddLineupDto } from './dto/add-lineup.dto';

@Injectable()
export class MatchLineupsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('match_lineups');
  }

  async findByMatch(matchId: string): Promise<MatchLineup[]> {
    const snapshot = await this.collection
      .where('matchId', '==', matchId)
      .get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<MatchLineup>(doc));
  }

  async add(dto: AddLineupDto): Promise<MatchLineup> {
    const existing = await this.collection
      .where('matchId', '==', dto.matchId)
      .where('userId', '==', dto.userId)
      .get();

    if (!existing.empty) {
      throw new ConflictException('Player already in lineup for this match');
    }

    const data = { ...dto, createdAt: new Date() };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data };
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Lineup entry with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
