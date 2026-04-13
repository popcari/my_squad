import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIRESTORE } from '../../config';
import { UpdateTeamSettingsDto } from './dto/update-team-settings.dto';
import { TeamSettings } from './types';

const DOC_ID = 'default';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class TeamSettingsService {
  private readonly collection;

  /** Simple in-process cache — avoids hitting Firestore on every GET */
  private cache: {
    data: TeamSettings & { playerCount: number };
    expiresAt: number;
  } | null = null;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('team_settings');
  }

  private invalidateCache() {
    this.cache = null;
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

  /** Fetches settings + playerCount with 30-minute in-memory cache. */
  async getCached(): Promise<TeamSettings & { playerCount: number }> {
    const now = Date.now();
    if (this.cache && now < this.cache.expiresAt) {
      return this.cache.data;
    }

    const [settings, playerCount] = await Promise.all([
      this.get(),
      this.getPlayerCount(),
    ]);

    const data = { ...settings, playerCount };
    this.cache = { data, expiresAt: now + CACHE_TTL_MS };
    return data;
  }

  async update(dto: UpdateTeamSettingsDto): Promise<TeamSettings> {
    const docRef = this.collection.doc(DOC_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({ ...dto, updatedAt: new Date() });
    } else {
      await docRef.update({ ...dto, updatedAt: new Date() });
    }

    this.invalidateCache(); // bust cache immediately on write
    return this.get();
  }

  async getPlayerCount(): Promise<number> {
    const snapshot = await this.firestore.collection('users').get();
    return snapshot.size;
  }
}
