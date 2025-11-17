import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { UsersModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token/token.module';
import { EmailsModule } from './emails/emails.module';
import { MailboxesModule } from './mailboxes/mailboxes.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
