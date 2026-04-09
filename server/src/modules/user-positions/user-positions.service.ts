import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { AssignPositionDto } from './dto/assign-position.dto';
import { UserPosition } from './types';

@Injectable()
export class UserPositionsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('user_positions');
  }

  async findByUser(userId: string): Promise<UserPosition[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<UserPosition>(doc));
  }

  async assign(dto: AssignPositionDto): Promise<UserPosition> {
    // Check duplicate position
    const existing = await this.collection
      .where('userId', '==', dto.userId)
      .where('positionId', '==', dto.positionId)
      .get();

    if (!existing.empty) {
      throw new ConflictException('Position already assigned to this user');
    }

    // Enforce max 1 primary position per user
    if (dto.type === 'primary') {
      const hasPrimary = await this.collection
        .where('userId', '==', dto.userId)
        .where('type', '==', 'primary')
        .get();

      if (!hasPrimary.empty) {
        throw new ConflictException('User already has a primary position');
      }
    }

    const data = { ...dto, createdAt: new Date() };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data };
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Assignment with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
