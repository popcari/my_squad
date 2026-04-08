import { Global, Module } from '@nestjs/common';
import {
  firebaseProviders,
  FIRESTORE,
  FIREBASE_AUTH,
} from './firebase.provider';

@Global()
@Module({
  providers: firebaseProviders,
  exports: [FIRESTORE, FIREBASE_AUTH],
})
export class FirebaseModule {}
