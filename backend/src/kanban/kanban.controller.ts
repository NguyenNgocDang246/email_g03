import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { KanbanService } from './kanban.service';

@Controller('kanban')
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Get('columns')
  async getColumns(@Req() req: Request) {
    const userId = req['user']?.id;
    return this.kanbanService.getColumns(userId);
  }

  @Post('columns')
  async createColumn(@Req() req: Request, @Body() body: any) {
    const userId = req['user']?.id;
    return this.kanbanService.createColumn(userId, {
      displayName: body?.displayName,
      description: body?.description,
    });
  }

  @Patch('columns/:id')
  async updateColumn(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req['user']?.id;
    return this.kanbanService.updateColumn(userId, id, {
      displayName: body?.displayName,
      description: body?.description,
    });
  }

  @Delete('columns/:id')
  async deleteColumn(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user']?.id;
    return this.kanbanService.deleteColumn(userId, id);
  }
}
