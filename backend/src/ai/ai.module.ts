import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailsModule } from '../emails/emails.module';
import { MailboxesModule } from '../mailboxes/mailboxes.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { TokenModule } from '../token/token.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    TokenModule,
    AuthModule,
    forwardRef(() => EmailsModule),
    forwardRef(() => MailboxesModule),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/ai');
  }
}
