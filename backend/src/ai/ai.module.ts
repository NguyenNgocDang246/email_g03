import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { EmailsModule } from '../emails/emails.module';
import { MailboxesModule } from '../mailboxes/mailboxes.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    TokenModule,
    AuthModule,
    EmailsModule,
    MailboxesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/ai');
  }
}
