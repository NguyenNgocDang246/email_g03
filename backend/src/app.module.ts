import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmailsModule } from './emails/emails.module';
import { KanbanModule } from './kanban/kanban.module';
import { MailboxesModule } from './mailboxes/mailboxes.module';
import { TokenModule } from './token/token.module';
import { UsersModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    UsersModule,
    TokenModule,
    EmailsModule,
    MailboxesModule,
    AuthModule,
    AiModule,
    KanbanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
