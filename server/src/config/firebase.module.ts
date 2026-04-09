import { Global, Module } from '@nestjs/common';
import {
  FIREBASE_AUTH,
  firebaseProviders,
  FIRESTORE,
} from './firebase.provider';

@Global()
@Module({
  providers: firebaseProviders,
  exports: [FIRESTORE, FIREBASE_AUTH],
})
export class FirebaseModule {}
