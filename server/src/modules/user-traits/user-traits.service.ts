import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { AssignTraitDto } from './dto/assign-trait.dto';
import { UpdateTraitRatingDto } from './dto/update-trait-rating.dto';
import { UserTrait } from './types';

@Injectable()
export class UserTraitsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('user_traits');
  }

  async findByUser(userId: string): Promise<UserTrait[]> {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<UserTrait>(doc));
  }

  async assign(dto: AssignTraitDto): Promise<UserTrait> {
    const existing = await this.collection
      .where('userId', '==', dto.userId)
      .where('traitId', '==', dto.traitId)
      .get();

    if (!existing.empty) {
      throw new ConflictException('Trait already assigned to this user');
    }

    const now = new Date();
    const data = { ...dto, createdAt: now, updatedAt: now };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data };
  }

  async updateRating(
    id: string,
    dto: UpdateTraitRatingDto,
  ): Promise<UserTrait> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`User trait with id "${id}" not found`);
    }

    await docRef.update({ rating: dto.rating, updatedAt: new Date() });
    const updated = await docRef.get();
    return mapFirestoreDoc<UserTrait>(updated);
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`User trait with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
