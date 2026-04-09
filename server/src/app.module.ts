import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './common';
import cloudinaryConfig from './config/cloudinary.config';
import { FirebaseModule, firebaseConfig } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { MatchGoalsModule } from './modules/match-goals/match-goals.module';
import { MatchLineupsModule } from './modules/match-lineups/match-lineups.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PositionsModule } from './modules/positions/positions.module';
import { TeamSettingsModule } from './modules/team-settings/team-settings.module';
import { TraitsModule } from './modules/traits/traits.module';
import { UserPositionsModule } from './modules/user-positions/user-positions.module';
import { UserTraitsModule } from './modules/user-traits/user-traits.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [firebaseConfig, cloudinaryConfig],
    }),
    FirebaseModule,
    UsersModule,
    PositionsModule,
    TraitsModule,
    UserPositionsModule,
    UserTraitsModule,
    MatchesModule,
    MatchLineupsModule,
    MatchGoalsModule,
    AuthModule,
    TeamSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
