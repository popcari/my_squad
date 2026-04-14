import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreateTraitDto } from './dto/create-trait.dto';
import { UpdateTraitDto } from './dto/update-trait.dto';
import { Trait } from './types';

@Injectable()
export class TraitsService {
  private readonly collection;
  private readonly userTraitsCol;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('traits');
    this.userTraitsCol = this.firestore.collection('user_traits');
  }

  async findAll(): Promise<Trait[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<Trait>(doc));
  }

  async findOne(id: string): Promise<Trait> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Trait with id "${id}" not found`);
    }
    return mapFirestoreDoc<Trait>(doc);
  }

  async create(dto: CreateTraitDto): Promise<Trait> {
    const existing = await this.collection.where('name', '==', dto.name).get();
    if (!existing.empty) {
      throw new ConflictException(`Trait "${dto.name}" already exists`);
    }

    const now = new Date();
    const data = { ...dto, createdAt: now, updatedAt: now };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data };
  }

  async update(id: string, dto: UpdateTraitDto): Promise<Trait> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Trait with id "${id}" not found`);
    }

    await docRef.update({ ...dto, updatedAt: new Date() });
    const updated = await docRef.get();
    return mapFirestoreDoc<Trait>(updated);
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Trait with id "${id}" not found`);
    }
    // Cascade: remove the trait from every player that had it assigned.
    const userTraits = await this.userTraitsCol
      .where('traitId', '==', id)
      .get();
    await Promise.all(userTraits.docs.map((d) => d.ref.delete()));
    await docRef.delete();
  }
}
