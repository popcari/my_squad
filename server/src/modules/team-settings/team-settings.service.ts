import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIRESTORE } from '../../config';
import { UpdateTeamSettingsDto } from './dto/update-team-settings.dto';
import { TeamSettings } from './types';

const DOC_ID = 'default';

@Injectable()
export class TeamSettingsService {
  private readonly collection;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('team_settings');
  }

  async get(): Promise<TeamSettings> {
    const doc = await this.collection.doc(DOC_ID).get();
    if (!doc.exists) {
      return {
        name: 'My Squad',
        updatedAt: new Date(),
      };
    }
    const data = doc.data()!;
    return {
      name: data.name ?? 'My Squad',
      description: data.description,
      foundedDate: data.foundedDate,
      logo: data.logo,
      homeStadium: data.homeStadium,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
    };
  }

  async update(dto: UpdateTeamSettingsDto): Promise<TeamSettings> {
    const docRef = this.collection.doc(DOC_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({ ...dto, updatedAt: new Date() });
    } else {
      await docRef.update({ ...dto, updatedAt: new Date() });
    }

    return this.get();
  }

  async getPlayerCount(): Promise<number> {
    const snapshot = await this.firestore.collection('users').get();
    return snapshot.size;
  }
}
