import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { TokenModule } from 'src/token/token.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [TokenModule, AuthModule],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/emails');
  }
}
