import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { KanbanService } from './kanban.service';

@Module({
  imports: [AuthModule],
  providers: [KanbanService],
  exports: [KanbanService],
})
export class KanbanModule {}
