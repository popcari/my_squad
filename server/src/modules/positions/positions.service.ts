import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './types';

@Injectable()
export class PositionsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('positions');
  }

  async findAll(): Promise<Position[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<Position>(doc));
  }

  async findOne(id: string): Promise<Position> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Position with id "${id}" not found`);
    }
    return mapFirestoreDoc<Position>(doc);
  }

  async create(dto: CreatePositionDto): Promise<Position> {
    const existing = await this.collection.where('name', '==', dto.name).get();
    if (!existing.empty) {
      throw new ConflictException(`Position "${dto.name}" already exists`);
    }

    const now = new Date();
    const data = { ...dto, createdAt: now, updatedAt: now };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data };
  }

  async update(id: string, dto: UpdatePositionDto): Promise<Position> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Position with id "${id}" not found`);
    }

    await docRef.update({ ...dto, updatedAt: new Date() });
    const updated = await docRef.get();
    return mapFirestoreDoc<Position>(updated);
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Position with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
