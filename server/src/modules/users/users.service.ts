import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../../common';
import { FIRESTORE } from '../../config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser, User, UserRole } from './types';

@Injectable()
export class UsersService {
  private readonly collection: admin.firestore.CollectionReference;

  constructor(
    @Inject(FIRESTORE) private readonly firestore: admin.firestore.Firestore,
  ) {
    this.collection = this.firestore.collection('users');
  }

  private stripPassword(user: User): PublicUser {
    const { password: _password, ...rest } = user;
    return rest;
  }

  async findAll(): Promise<PublicUser[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) =>
      this.stripPassword(mapFirestoreDoc<User>(doc)),
    );
  }

  async findOne(id: string): Promise<PublicUser> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return this.stripPassword(mapFirestoreDoc<User>(doc));
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.collection
      .where('email', '==', dto.email)
      .get();
    if (!existing.empty) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const now = new Date();
    const data = {
      ...dto,
      status: dto.status ?? 1,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.collection.add(data);
    return this.stripPassword({ id: docRef.id, ...data } as User);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    await docRef.update({ ...dto, updatedAt: new Date() });

    const updated = await docRef.get();
    return this.stripPassword(mapFirestoreDoc<User>(updated));
  }

  async remove(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    await docRef.delete();
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('email', '==', email).get();
    if (snapshot.empty) return null;
    return mapFirestoreDoc<User>(snapshot.docs[0]);
  }

  async findByRole(role: UserRole): Promise<PublicUser[]> {
    const snapshot = await this.collection.where('role', '==', role).get();
    return snapshot.docs.map((doc) =>
      this.stripPassword(mapFirestoreDoc<User>(doc)),
    );
  }
}
