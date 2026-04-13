import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreateFormationDto, UpdateFormationDto } from './dto';
import { Formation } from './types';

@Injectable()
export class FormationsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('formations');
  }

  async findAll(): Promise<Formation[]> {
    const snap = await this.collection.get();
    return snap.docs.map((doc) => mapFirestoreDoc<Formation>(doc));
  }

  async findOne(id: string): Promise<Formation> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Formation with id "${id}" not found`);
    }
    return mapFirestoreDoc<Formation>(doc);
  }

  async create(dto: CreateFormationDto): Promise<Formation> {
    const now = new Date();
    // class-validator/class-transformer turns nested slots into class instances;
    // Firestore only accepts plain objects, so we strip prototypes here.
    const data = {
      name: dto.name,
      slots: dto.slots.map((s) => ({ role: s.role, x: s.x, y: s.y })),
      createdAt: now,
      updatedAt: now,
    };
    const ref = await this.collection.add(data);
    return { id: ref.id, ...data } as Formation;
  }

  async update(id: string, dto: UpdateFormationDto): Promise<Formation> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Formation with id "${id}" not found`);
    }
    const payload: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.slots !== undefined) {
      payload.slots = dto.slots.map((s) => ({
        role: s.role,
        x: s.x,
        y: s.y,
      }));
    }
    await docRef.update(payload);
    const updated = await docRef.get();
    return mapFirestoreDoc<Formation>(updated);
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Formation with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
