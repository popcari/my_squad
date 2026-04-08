import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_APP = 'FIREBASE_APP';
export const FIRESTORE = 'FIRESTORE';
export const FIREBASE_AUTH = 'FIREBASE_AUTH';

export const firebaseProviders: Provider[] = [
  {
    provide: FIREBASE_APP,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const projectId = config.get<string>('firebase.projectId');
      const clientEmail = config.get<string>('firebase.clientEmail');
      const privateKey = config.get<string>('firebase.privateKey');

      if (admin.apps.length) {
        return admin.apps[0]!;
      }

      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    },
  },
  {
    provide: FIRESTORE,
    inject: [FIREBASE_APP],
    useFactory: (app: admin.app.App) => {
      const firestore = app.firestore();
      firestore.settings({ ignoreUndefinedProperties: true });
      return firestore;
    },
  },
  {
    provide: FIREBASE_AUTH,
    inject: [FIREBASE_APP],
    useFactory: (app: admin.app.App) => app.auth(),
  },
];
