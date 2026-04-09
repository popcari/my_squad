import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { mapFirestoreDoc } from '../utils/firestore.util';

interface UserData {
  id: string;
  role: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly usersCollection;

  constructor() {
    this.usersCollection = admin.firestore().collection('users');
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'] as string | undefined;

    if (userId) {
      const doc = await this.usersCollection.doc(userId).get();
      if (doc.exists) {
        (req as Request & { user: UserData }).user =
          mapFirestoreDoc<UserData>(doc);
      }
    }

    next();
  }
}
