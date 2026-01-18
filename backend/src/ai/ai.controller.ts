import { Body, Controller, Param, Post, Query, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Request } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('search')
  async semanticSearch(@Body() body, @Req() req: Request) {
    const { query, mailboxId, limit } = body || {};
    const userId = req['user']?.id;

    if (!userId || !query || !query.trim()) {
      return { data: [] };
    }

    const results = await this.aiService.semanticSearch(
      mailboxId,
      query,
      userId,
      { limit },
    );

    return { data: results };
  }

  @Post('emails/:id/summarize')
  async summarize(
    @Param('id') id: string,
    @Query('refresh') refresh: string | undefined,
    @Req() req: Request,
  ) {
    const data = req['user'];
    const userId = data?.id;
    const forceRefresh = refresh === 'true' || refresh === '1';
    const summary = await this.aiService.summarizeEmail(
      id,
      userId,
      forceRefresh,
    );
    return summary ?? { summary: 'Email not found', metadata: {} };
  }
}
