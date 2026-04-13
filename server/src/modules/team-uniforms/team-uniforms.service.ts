import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreateTeamUniformDto } from './dto/create-team-uniform.dto';
import { UpdateTeamUniformDto } from './dto/update-team-uniform.dto';
import { TeamUniform } from './types';

@Injectable()
export class TeamUniformsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('team_uniforms');
  }

  async findAll(): Promise<TeamUniform[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<TeamUniform>(doc));
  }

  async findByYear(year: number): Promise<TeamUniform[]> {
    const snapshot = await this.collection.where('year', '==', year).get();
    return snapshot.docs.map((doc) => mapFirestoreDoc<TeamUniform>(doc));
  }

  async create(dto: CreateTeamUniformDto): Promise<TeamUniform> {
    const now = new Date();
    const data = { ...dto, createdAt: now, updatedAt: now };
    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data } as TeamUniform;
  }

  async update(id: string, dto: UpdateTeamUniformDto): Promise<TeamUniform> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Team uniform with id "${id}" not found`);
    }

    await docRef.update({ ...dto, updatedAt: new Date() });

    const updated = await docRef.get();
    return mapFirestoreDoc<TeamUniform>(updated);
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Team uniform with id "${id}" not found`);
    }
    await docRef.delete();
  }
}
